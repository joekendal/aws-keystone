import { Template } from '@aws-cdk/assertions';
import * as cdk from '@aws-cdk/core';

import { KeystoneStack, KeystoneStackProps } from '../example/keystone';

describe('Fargate', () => {

  test('should use compute settings', () => {
    const app = new cdk.App();

    const props: KeystoneStackProps = {
      cpu: 512,
    };

    const template = Template.fromStack(
      new KeystoneStack(app, 'Keystone', {
        ...props,
      }),
    );

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Cpu: props.cpu?.toString(),
    });
  });


});