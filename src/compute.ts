import path from 'path';

import * as cdk from '@aws-cdk/core'
import * as ecs from '@aws-cdk/aws-ecs';
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';

import { IHostedZone } from '@aws-cdk/aws-route53'
import { Secret } from '@aws-cdk/aws-secretsmanager';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import { ICertificate } from '@aws-cdk/aws-certificatemanager'
import { ApplicationProtocol } from '@aws-cdk/aws-elasticloadbalancingv2'


export interface ComputeProps {
  // the VPC for the cluster to reside
  vpc: ec2.IVpc
  /**
   * the number of cpu units
   * @default 512
   */
  cpu?: number
  /**
   * the number of instances
   * @default 1
   */
  instances?: number
  /**
   * the amount of memory
   * @default 1024
   */
  memory?: number
  // the postgresql connection url
  dbUrl: string
  // the domain name to use
  domainName?: string
  // the domain zone
  zone?: IHostedZone
  // the acm certificate
  cert?: ICertificate
}

export class Compute extends cdk.Construct {
  public readonly cluster: ecs.Cluster
  public readonly service: ecs_patterns.ApplicationLoadBalancedFargateService

  constructor(scope: cdk.Construct, id: string, props: ComputeProps) {
    super(scope, id)

    // Docker image
    const asset = new DockerImageAsset(this, 'KeystoneBuild', {
      directory: path.join(__dirname, 'keystone'),
    });

    // ECS cluster
    this.cluster = new ecs.Cluster(this, 'KeystoneCluster', {
      vpc: props.vpc,
    })

    // Session secret
    const secret = new Secret(this, 'SessionSecret', {
      secretName: 'KeystoneSession',
      generateSecretString: {
        // change as appropriate...
        passwordLength: 32,
      },
    });

    // Task definition
    const taskImage: ecs_patterns.ApplicationLoadBalancedTaskImageOptions = {
      image: ecs.ContainerImage.fromDockerImageAsset(asset),
      // port specified by keystone in Dockerfile
      containerPort: 3000,
      secrets: {
        // required by keystone
        SESSION_SECRET: ecs.Secret.fromSecretsManager(secret),
      },
      environment: {
        // pass in aurora connection url
        DATABASE_URL: props.dbUrl,
      },
    }

    // Fargate with ALB
    this.service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'KeystoneService', {
      cluster: this.cluster,
      cpu: props?.cpu ?? 512,
      desiredCount: props?.instances ?? 1,
      memoryLimitMiB: props?.memory ?? 1024,
      taskImageOptions: taskImage,
      healthCheckGracePeriod: cdk.Duration.seconds(300),
      domainName: props.domainName,
      domainZone: props.zone,
      certificate: props.cert,
      redirectHTTP: props.cert ? true : false,
      listenerPort: props.cert ? 443 : 80,
      targetProtocol: ApplicationProtocol.HTTP
    })

    // add keystone health check
    this.service.targetGroup.configureHealthCheck({
      path: '/_healthcheck'
    })

  }
}