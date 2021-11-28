import { Template } from '@aws-cdk/assertions';
import * as cdk from '@aws-cdk/core';

import { Keystone, KeystoneProps } from '../src/main';

describe('Fargate', () => {

  test('should use props', () => {
    const app = new cdk.App();

    const props: KeystoneProps = {
      cpu: 512,
      publicLoadBalancer: false,
    };

    const template = Template.fromStack(
      new Keystone(app, 'Keystone', {
        ...props,
      }),
    );

    // compute settings
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Cpu: props.cpu?.toString(),
    });

    // public ip
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: props.publicLoadBalancer,
    });

  });


});