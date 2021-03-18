#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { S3AntivirusStack } from '../lib/s3antivirus-stack';

const app = new cdk.App();
new S3AntivirusStack(app, 'S3AntivirusStack');
