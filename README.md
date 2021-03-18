# S3 Anti-Virus

This repository contains an Anti-Virus solution for S3. Build with Lambda and EFS, deployed by CDK

# CDK Information

## Environments

Environments are configured in the _config_ directory. Each environment has it's own file. If you need to access an account via SSO, it is necessary to use a workaround. Check out the [Credits](#Credits) section.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

# Credits

- S3 Anti-Virus solution: https://github.com/truework/lambda-s3-antivirus/
- CDK environments in external files: https://www.rehanvdm.com/aws/4-methods-to-configure-multiple-environments-in-the-aws-cdk/index.html
- CDK with SSO: https://github.com/aws/aws-cdk/issues/5455#issuecomment-735223080
