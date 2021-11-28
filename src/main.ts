import path from 'path';
import * as ec2 from '@aws-cdk/aws-ec2';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import * as cdk from '@aws-cdk/core';


export interface KeystoneProps extends cdk.StackProps {
  /**
   * The number of cpu units used by the task.
   *
   * Valid values, which determines your range of valid values for the memory parameter:
   * 256 (.25 vCPU) - Available memory values: 0.5GB, 1GB, 2GB
   * 512 (.5 vCPU) - Available memory values: 1GB, 2GB, 3GB, 4GB
   * 1024 (1 vCPU) - Available memory values: 2GB, 3GB, 4GB, 5GB, 6GB, 7GB, 8GB
   * 2048 (2 vCPU) - Available memory values: Between 4GB and 16GB in 1GB increments
   * 4096 (4 vCPU) - Available memory values: Between 8GB and 30GB in 1GB increments
   *
   * This default is set in the underlying FargateTaskDefinition construct.
   * @default 256
   * @stability stable
   */
  readonly cpu?: number;

  /**
   * The amount (in MiB) of memory used by the task.
   *
   * This field is required and you must use one of the following values, which determines your range of valid values
   * for the cpu parameter:
   * 512 (0.5 GB), 1024 (1 GB), 2048 (2 GB) - Available cpu values: 256 (.25 vCPU)
   * 1024 (1 GB), 2048 (2 GB), 3072 (3 GB), 4096 (4 GB) - Available cpu values: 512 (.5 vCPU)
   * 2048 (2 GB), 3072 (3 GB), 4096 (4 GB), 5120 (5 GB), 6144 (6 GB), 7168 (7 GB), 8192 (8 GB) - Available cpu values: 1024 (1 vCPU)
   * Between 4096 (4 GB) and 16384 (16 GB) in increments of 1024 (1 GB) - Available cpu values: 2048 (2 vCPU)
   * Between 8192 (8 GB) and 30720 (30 GB) in increments of 1024 (1 GB) - Available cpu values: 4096 (4 vCPU)
   *
   * This default is set in the underlying FargateTaskDefinition construct.
   * @default 512
   * @stability stable
   */
  readonly memoryLimitMiB?: number;

  /**
   * The desired number of instantiations of the task definition to keep running on the service.
   *
   * The minimum value is 1
   *
   * @default - If the feature flag, ECS_REMOVE_DEFAULT_DESIRED_COUNT is false, the default is 1;
   * if true, the default is 1 for all new services and uses the existing services desired count
   * when updating an existing service.
   * @stability stable
   */
  readonly desiredCount?: number;

  /**
  * Determines whether the Load Balancer will be internet-facing.
  *
  * @default true
  * @stability stable
  */
  readonly publicLoadBalancer?: boolean;
}

export class Keystone extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: KeystoneProps) {
    super(scope, id, props);

    const asset = new DockerImageAsset(this, 'KeystoneBuild', {
      directory: path.join(__dirname, 'keystone'),
    });

    // Default VPC with all 3 AVs in the region
    const vpc = new ec2.Vpc(this, 'KeystoneVPC', {
      maxAzs: 3,
    });

    // ECS cluster
    const cluster = new ecs.Cluster(this, 'KeystoneCluster', {
      vpc,
    });

    // Fargate with load balancer (public)
    new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'KeystoneService', {
      cluster,
      cpu: props?.cpu,
      desiredCount: props?.desiredCount,
      memoryLimitMiB: props?.memoryLimitMiB,
      publicLoadBalancer: props?.publicLoadBalancer,
      taskImageOptions: {
        image: ecs.ContainerImage.fromDockerImageAsset(asset),
      },
    });
  }
}

const app = new cdk.App();

new Keystone(app, 'KeystoneJS', {
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION
  }
});

app.synth();