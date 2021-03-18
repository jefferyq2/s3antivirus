import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as efs from '@aws-cdk/aws-efs';

export class S3AntivirusStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create network Resources
    const vpc = new ec2.Vpc(this, 'AvVPC',{
      cidr: "192.168.0.0/24",
      subnetConfiguration: [
        {
          cidrMask: 27,
          name: 'subnet',
          subnetType: ec2.SubnetType.ISOLATED
        }
      ]
    });

    // security groups
    //const sg = new ec2.SecurityGroup(this, 'AvVPCSg',{
    //  vpc: vpc
    //});

    // VPC endpoint
    const vpcep = new ec2.GatewayVpcEndpoint(this, 'AvVPCEp',{
      service: ec2.GatewayVpcEndpointAwsService.S3,
      vpc: vpc
    });

    // EFS - Elastic File System
    const fileSystem = new efs.FileSystem(this, 'AvEfs', {
      vpc: vpc,
      encrypted: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    fileSystem.addAccessPoint('AvEfsAp',{
      path: '/lambda',
      createAcl: {
        ownerGid: "1000",
        ownerUid: "1000",
        permissions: "0777"
      }
    });

  }
}
