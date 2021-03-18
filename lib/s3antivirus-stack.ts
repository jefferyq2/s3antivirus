import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class S3AntivirusStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create network Resources
    const vpc = new ec2.Vpc(this, 'AvVPC',{
      cidr: "192.168.0.0/24",
      subnetConfiguration: [
        {
          cidrMask: 25,
          name: 'application',
          subnetType: ec2.SubnetType.ISOLATED
        }
      ]
    });
  }
}
