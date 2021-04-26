/* eslint-disable no-unused-vars */
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as efs from '@aws-cdk/aws-efs';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as destinations from '@aws-cdk/aws-lambda-destinations';
import * as event from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as path from 'path';
import { avConfig } from './av-config';

interface S3AntivirusStackProps extends cdk.StackProps {

  /**
   * Cidr notation for the VPC
   *
   * @default - ec2.Vpc.DEFAULT_CIDR_RANGE
   * @example - '192.168.0.0/24'
   */
  vpcCidr?: string
}
export class S3AntivirusStack extends cdk.Stack {
  constructor (scope: cdk.Construct, id: string, props: S3AntivirusStackProps) {
    super(scope, id, props);

    // S3 bucket for AV definitions
    const s3avdev = new s3.Bucket(this, 'definitions', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const vpc = new ec2.Vpc(this, 'AvVPC', {
      cidr: props.vpcCidr ? props.vpcCidr : ec2.Vpc.DEFAULT_CIDR_RANGE,
      subnetConfiguration: [
        {
          cidrMask: 27,
          name: 'subnet',
          subnetType: ec2.SubnetType.ISOLATED
        }
      ]
    });

    // security groups
    const sg = new ec2.SecurityGroup(this, 'AvVPCSg', {
      vpc: vpc
    });

    // VPC endpoint
    const vpcep = new ec2.GatewayVpcEndpoint(this, 'AvVPCEp', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      vpc: vpc
    });

    // EFS - Elastic File System
    const fileSystem = new efs.FileSystem(this, 'AvEfs', {
      vpc: vpc,
      encrypted: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // EFS - Accesspoint
    const efsAp = fileSystem.addAccessPoint('AvEfsAp', {
      path: avConfig.efsPath,
      createAcl: {
        ownerGid: '1000',
        ownerUid: '1000',
        permissions: '0777'
      },
      posixUser: {
        gid: '1000',
        uid: '1000'
      }
    });
    // #endregion

    // #region - Move AV definitions from S3 to EFS
    // Lambda function
    const fnMvDev = new lambda.Function(this, 'definitionsMoveToEfs', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.lambdaHandleEvent',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'mvDefinitionFiles')),
      memorySize: 512,
      timeout: cdk.Duration.minutes(1),
      environment: {
        CLAMAV_BUCKET_NAME: s3avdev.bucketName,
        PATH_TO_AV_DEFINITIONS: avConfig.avDefS3KeyPrefix,
        FRESHCLAM_WORK_DIR: avConfig.mountpoint
      },
      vpc: vpc,
      filesystem: lambda.FileSystem.fromEfsAccessPoint(efsAp, avConfig.mountpoint)
    });
    // grant read permissions to get the definition files
    s3avdev.grantReadWrite(fnMvDev);
    // #endregion

    // #region - Download AV definitions from the web

    // Lambda function that downloads definition files
    const fnDefDl = new lambda.Function(this, 'definitionsDownload', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'download-definitions.lambdaHandleEvent',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'clamav')),
      memorySize: 1024,
      timeout: cdk.Duration.minutes(2),
      environment: {
        CLAMAV_BUCKET_NAME: s3avdev.bucketName,
        PATH_TO_AV_DEFINITIONS: avConfig.avDefS3KeyPrefix
      },
      onSuccess: new destinations.LambdaDestination(fnMvDev)
    });

    // grant lambda permission to the S3 bucket for AV definitions
    s3avdev.grantReadWrite(fnDefDl);

    // add a trigger schedule
    const ebRuleDefDl = new event.Rule(this, 'definitionsDownloadRule', {
      description: 'triggers a Lambda function to download the Antivirus definition files',
      schedule: event.Schedule.rate(cdk.Duration.hours(3)),
      targets: [
        new targets.LambdaFunction(fnDefDl)
      ]
    });
    // #endregion

    // #region - Antivirus scanner
    const fnAvScn = new lambda.Function(this, 'AntivirusScan', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'antivirus.lambdaHandleEvent',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'clamav')),
      memorySize: 4096, // TODO - Loadtesting
      timeout: cdk.Duration.minutes(5),
      environment: {
        CLAMAV_BUCKET_NAME: s3avdev.bucketName,
        FRESHCLAM_WORK_DIR: avConfig.mountpoint
        // MAX_FILE_SIZE: avConfig.maxFileSize.toString()
      },
      vpc: vpc,
      filesystem: lambda.FileSystem.fromEfsAccessPoint(efsAp, avConfig.mountpoint)
    });

    // grant permission to tag files on S3
    fnAvScn.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        's3:*Tagging'
      ]
    }));

    // grant the scan function read access to all S3 buckets
    if (fnAvScn.role) {
      fnAvScn.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));
    };

    // grant EventBridge to invoke scan function
    const fnAvScnInvoke = new lambda.CfnPermission(this, 'AntivirusScanInvokePermission', {
      action: 'lambda:InvokeFunction',
      functionName: fnAvScn.functionName,
      principal: 'events.amazonaws.com'
    });

    // export the Lambda function name in CloudFormation to make it available to other stacks
    const outfnAvScn = new cdk.CfnOutput(this, 'outfnAvScnArn', {
      exportName: this.stackName + '-AvScanFunction',
      value: fnAvScn.functionArn,
      description: 'Lambda function to call to scan a file'
    });

    // #endregion
  }
}
