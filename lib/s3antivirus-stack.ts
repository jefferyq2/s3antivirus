import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as efs from '@aws-cdk/aws-efs';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as destinations from '@aws-cdk/aws-lambda-destinations';
import * as event from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as path from 'path';
import { avConfig } from './av-config';

export class S3AntivirusStack extends cdk.Stack {
  constructor (scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for AV definitions
    const s3avdev = new s3.Bucket(this, 'definitions', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // create network Resources
    const vpc = new ec2.Vpc(this, 'AvVPC', {
      cidr: '192.168.0.0/24',
      subnetConfiguration: [
        {
          cidrMask: 27,
          name: 'subnet',
          subnetType: ec2.SubnetType.ISOLATED
        }
      ]
    });

/*     const vpc = ec2.Vpc.fromLookup(this, 'defaultVPC',{
      isDefault: true
    }); */

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
    s3avdev.grantRead(fnMvDev);

    // trigger to move AV definitions to EFS
/*     const ebRuleMvDevToEfs = new event.Rule(this, 'moveDefinitionsToEfsRule', {
      description: 'triggers a Lambda to move the Defintions from S3 to EFS',
      eventPattern: {
        source: ['aws.lambda'],
        detail: {
          eventName: ['Invoke'],
          resources: [
            {
              ARN: fnDefDl.functionArn
            }
          ]
        }
      }
    }); */

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
/*     eventPattern: {
      source: ['aws.s3'],
      resources:[s3avdev.bucketArn],
      detail: {
        'eventName': ['PutObject']
      }
    } */
    // #endregion

  }
}
