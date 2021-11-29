import * as cdk from '@aws-cdk/core'

import { Keystone } from '../src/main';

const app = new cdk.App();


new Keystone(app, 'KeystoneJS', {
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
  domainName: process.env.DOMAIN_NAME,
});

app.synth();