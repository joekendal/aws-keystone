import path from 'path';
import * as ec2 from '@aws-cdk/aws-ec2';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import { Secret } from '@aws-cdk/aws-secretsmanager';
import * as cdk from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds'


export interface KeystoneProps extends cdk.StackProps {
  /**
   * The number of cpu units used by the task.
   *
   * Valid values, which determines your range of valid values for the memory parameter:
   * 512 (.5 vCPU) - Available memory values: 1GB, 2GB, 3GB, 4GB
   * 1024 (1 vCPU) - Available memory values: 2GB, 3GB, 4GB, 5GB, 6GB, 7GB, 8GB
   * 2048 (2 vCPU) - Available memory values: Between 4GB and 16GB in 1GB increments
   * 4096 (4 vCPU) - Available memory values: Between 8GB and 30GB in 1GB increments
   *
   * @default 512
   * @stability stable
   */
  readonly cpu?: number;

  /**
   * The amount (in MiB) of memory used by the task.
   *
   * This field is required and you must use one of the following values, which determines your range of valid values
   * for the cpu parameter:
   * 1024 (1 GB), 2048 (2 GB), 3072 (3 GB), 4096 (4 GB) - Available cpu values: 512 (.5 vCPU)
   * 2048 (2 GB), 3072 (3 GB), 4096 (4 GB), 5120 (5 GB), 6144 (6 GB), 7168 (7 GB), 8192 (8 GB) - Available cpu values: 1024 (1 vCPU)
   * Between 4096 (4 GB) and 16384 (16 GB) in increments of 1024 (1 GB) - Available cpu values: 2048 (2 vCPU)
   * Between 8192 (8 GB) and 30720 (30 GB) in increments of 1024 (1 GB) - Available cpu values: 4096 (4 vCPU)
   *
   * This default is set in the underlying FargateTaskDefinition construct.
   * @default 1024
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

  /**
   * Scaling configuration of an Aurora Serverless database cluster.
   *
   * @default - Serverless cluster is automatically paused after 5 minutes of being idle.
   * minimum capacity: 2 ACU
   * maximum capacity: 16 ACU
   * @stability stable
   */
  readonly auroraScaling?: rds.ServerlessScalingOptions;
}

export class Keystone extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: KeystoneProps) {
    super(scope, id, props);

    const asset = new DockerImageAsset(this, 'KeystoneBuild', {
      directory: path.join(__dirname, 'keystone'),
    });

    // VPC
    const vpc = new ec2.Vpc(this, 'KeystoneVPC', {
      subnetConfiguration: [
        { name: 'elb_public_', subnetType: ec2.SubnetType.PUBLIC },
        { name: 'ecs_private_', subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
        { name: 'aurora_isolated_', subnetType: ec2.SubnetType.PRIVATE_ISOLATED }
      ]
    });

    const dbName = 'keystone'
    const dbSubnetGroup = new rds.SubnetGroup(this, 'AuroraSubnetGroup', {
      description: 'Subnet group to access Aurora',
      vpcSubnets: { subnets: vpc.isolatedSubnets },
      vpc
    })
    const dbClusterSg = new ec2.SecurityGroup(this, 'DbClusterSg', { vpc })
    // allow ECS to access Aurora
    vpc.privateSubnets.forEach((subnet) => {
      dbClusterSg.addIngressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.tcp(5432))
    })

    // RDS cluster
    const creds = rds.Credentials.fromGeneratedSecret('keystone')
    const aurora = new rds.ServerlessCluster(this, 'KeystoneDatabase', {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql10'),
      vpc,
      scaling: props.auroraScaling,
      credentials: creds,
      subnetGroup: dbSubnetGroup,
      defaultDatabaseName: dbName,
      securityGroups: [dbClusterSg],
    })

    // ECS cluster
    const cluster = new ecs.Cluster(this, 'KeystoneCluster', {
      vpc,
    });

    // Session secret
    const secret = new Secret(this, 'SessionSecret', {
      secretName: 'KeystoneSession',
      generateSecretString: {
        // change as appropriate...
        passwordLength: 32,
      },
    });

    // Fargate with load balancer (public)
    new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'KeystoneService', {
      cluster,
      cpu: props?.cpu ?? 512,
      desiredCount: props?.desiredCount,
      memoryLimitMiB: props?.memoryLimitMiB ?? 1024,
      publicLoadBalancer: props?.publicLoadBalancer,
      taskImageOptions: {
        image: ecs.ContainerImage.fromDockerImageAsset(asset),
        containerPort: 3000,
        secrets: {
          SESSION_SECRET: ecs.Secret.fromSecretsManager(secret),
        },
        environment: {
          DATABASE_URL: cdk.Fn.join("", [
            "postgres://", creds.username, ":", aurora.secret!.secretValueFromJson('password').toString(),
            "@", aurora.clusterEndpoint.hostname, ":", "5432",
            "/", dbName
          ])
        }
      },
      healthCheckGracePeriod: cdk.Duration.seconds(60 * 10)
    });
  }
}

const app = new cdk.App();

new Keystone(app, 'KeystoneJS', {
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
});

app.synth();