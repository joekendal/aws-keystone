const { AwsCdkConstructLibrary, NpmAccess } = require('projen');
const project = new AwsCdkConstructLibrary({
  author: 'nexusmed',
  authorAddress: 'open-source@nexusmed.io',
  cdkVersion: '1.134.0',
  defaultReleaseBranch: 'main',
  name: 'aws-keystone',
  repositoryUrl: 'https://github.com/nexusmed/aws-keystone.git',
  prerelease: 'alpha',
  codeCov: true,
  license: 'MIT',
  devContainer: true,
  keywords: ['cdk', 'keystone', 'aws'],
  packageName: 'aws-keystone',
  description: 'Serverless deployment of Keystone on AWS',
  npmAccess: NpmAccess.PUBLIC,
  cdkAssert: false,
  deps: [
    '@aws-cdk/core',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs-patterns',
  ],
  devDeps: [
    '@aws-cdk/assertions',
  ], /* Build dependencies for this module. */
  // release: undefined,              /* Add release management to this project. */
});
project.synth();