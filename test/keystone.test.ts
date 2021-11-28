import { Template, Match } from '@aws-cdk/assertions';
import * as cdk from '@aws-cdk/core';

import { Keystone, KeystoneProps } from '../src/main';

describe('should create ALB Fargate', () => {
  let app: cdk.App;
  let template: Template;
  const props: KeystoneProps = {
    cpu: 512,
    publicLoadBalancer: false,
  };

  beforeAll(() => {
    app = new cdk.App();

    template = Template.fromStack(
      new Keystone(app, 'Keystone', {
        ...props,
      }),
    );
  });

  test('should use props', () => {
    // compute settings
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Cpu: props.cpu?.toString(),
    });

    // public ip
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: props.publicLoadBalancer,
    });
  });

  test('should have SESSION_SECRET', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Secrets: Match.arrayWith([
            Match.objectLike({
              Name: 'SESSION_SECRET',
            }),
          ]),
        }),
      ]),
    });
  });

  test('should map from 80 to 3000', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([Match.objectLike({
        CidrIp: '0.0.0.0/0',
        FromPort: 80,
        IpProtocol: 'tcp',
        ToPort: 80,
      })]),
    });
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
    });
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 80,
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
      FromPort: 3000,
      ToPort: 3000,
    });
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          PortMappings: Match.arrayWith([
            Match.objectLike({
              ContainerPort: 3000,
              Protocol: 'tcp',
            }),
          ]),
        }),
      ]),
    });
    template.hasResourceProperties('AWS::ECS::Service', {
      LoadBalancers: Match.arrayWith([
        Match.objectLike({
          ContainerPort: 3000,
        }),
      ]),
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 3000,
      ToPort: 3000,
    });

  });

});

describe('should create Aurora', () => {

})