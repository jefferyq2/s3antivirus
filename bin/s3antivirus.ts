#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { S3AntivirusStack } from '../lib/s3antivirus-stack';
import { BuildConfig } from '../lib/build-config';
import * as fs from 'fs';
import * as path from 'path';
import { Tags } from '@aws-cdk/core';
const yaml = require('js-yaml');

const app = new cdk.App();

function ensureString (object: { [name: string]: any }, propName: string): string {
  if (!object[propName] || object[propName].trim().length === 0) { throw new Error(propName + ' does not exist or is empty'); }
  return object[propName];
}
function ensureArray (object: { [name: string]: any }, propName: string): string[] {
  if (!object[propName] || object[propName].length === 0) { throw new Error(propName + ' does not exist or is empty'); }
  return object[propName];
}

function getConfig () {
  const env = app.node.tryGetContext('config');
  if (!env) {
    throw new Error('Context variable missing on CDK command. Pass in as \'-c config=xxx\'');
  }

  const unparsedEnv = yaml.load(fs.readFileSync(path.resolve('./config/' + env + '.yaml'), 'utf8'));

  const buildConfig: BuildConfig = {
    AWSAccountID: ensureString(unparsedEnv, 'AWSAccountID'),
    AWSProfileName: ensureString(unparsedEnv, 'AWSProfileName'),
    AWSRegions: ensureArray(unparsedEnv, 'AWSRegions'),
    VpcCidr: ensureString(unparsedEnv, 'VpcCidr'),

    App: ensureString(unparsedEnv, 'App'),
    Version: ensureString(unparsedEnv, 'Version'),
    Environment: ensureString(unparsedEnv, 'Environment')
  };

  return buildConfig;
}

function Main () {
  const buildConfig: BuildConfig = getConfig();

  // set Tags for the whole app
  Tags.of(app).add('App', buildConfig.App);
  Tags.of(app).add('Environment', buildConfig.Environment);

  buildConfig.AWSRegions.forEach((region) => {
    const stackName = buildConfig.App + '-' + buildConfig.Environment + '-' + region;
    // eslint-disable-next-line no-unused-vars
    const stack = new S3AntivirusStack(app, stackName, {
      env: {
        region: region,
        account: buildConfig.AWSAccountID
      },
      vpcCidr: buildConfig.VpcCidr
    });
  });
}
Main();
