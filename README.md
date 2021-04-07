# S3 Anti-Virus

This repository contains an Anti-Virus solution for S3. Build with Lambda and EFS, deployed by CDK

## Configuration

The configuration of specific environments (dev/prd) are located in the directory `/config`. Each environment has its own configuration file.

## Deployment

Since the the configuration the environments is outsourced in separated files, it is necessary to provide the config with each `cdk` command. And if you not wish to deploy with the default profile of the `aws cli` you have to provide the profile too. See examples below.

- List all stacks of an environment

  ```
  cdk list -c config=prd --profile filetransfer
  ```

- Bootstrap an account / region (This is required only once per account and region). Even though the config parameter has no impact in this command, it is currently required.
  ```
  cdk bootstrap aws://914898555282/ap-northeast-2 -c config=dev --profile filetransfer
  ```
- **Deploy** (a specific stack | all stacks)
  ```
  cdk deploy <stackname|--all> -c config=prd --profile filetransfer
  ```
  If you are deploying multiple stacks it can be annoying to confirm changes on IAM for every stack. If you want to automatically confirm, you can append `--require-approval never`. (Check the [docs](https://docs.aws.amazon.com/cdk/latest/guide/cli.html#cli-security))

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
