const { AwsCdkConstructLibrary, NpmAccess } = require('projen');
const project = new AwsCdkConstructLibrary({
  author: 'nexusmed',
  authorAddress: 'open-source@nexusmed.io',
  cdkVersion: '1.95.2',
  defaultReleaseBranch: 'main',
  name: 'aws-keystone',
  repositoryUrl: 'https://github.com/nexusmed/aws-keystone.git',
  prerelease: 'alpha',
  codeCov: true,
  license: "MIT",
  devContainer: true,
  keywords: ['cdk','keystone','aws'],
  packageName: 'aws-keystone',
  description: 'Serverless deployment of Keystone on AWS',
  npmAccess: NpmAccess.PUBLIC,
  // cdkDependencies: undefined,      /* Which AWS CDK modules (those that start with "@aws-cdk/") does this library require when consumed? */
  // cdkTestDependencies: undefined,  /* AWS CDK modules required for testing. */
  // deps: [],                        /* Runtime dependencies of this module. */
  // devDeps: [],                     /* Build dependencies for this module. */
  // release: undefined,              /* Add release management to this project. */
});
project.synth();