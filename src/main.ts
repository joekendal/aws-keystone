import * as cdk from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds';
import * as route53 from '@aws-cdk/aws-route53'
import * as acm from '@aws-cdk/aws-certificatemanager'

import { Network } from './network';
import { Database } from './database';
import { Compute } from './compute';


export interface KeystoneProps extends cdk.StackProps {
  /**
   * Specify a custom domain name.
   * 
   * This will create an ACM certificate and Route53 record
   */
  readonly domainName?: string;

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
   * 
   * 1024 (1 GB), 2048 (2 GB), 3072 (3 GB), 4096 (4 GB) - Available cpu values: 512 (.5 vCPU)
   * 2048 (2 GB), 3072 (3 GB), 4096 (4 GB), 5120 (5 GB), 6144 (6 GB), 7168 (7 GB), 8192 (8 GB) - Available cpu values: 1024 (1 vCPU)
   * Between 4096 (4 GB) and 16384 (16 GB) in increments of 1024 (1 GB) - Available cpu values: 2048 (2 vCPU)
   * Between 8192 (8 GB) and 30720 (30 GB) in increments of 1024 (1 GB) - Available cpu values: 4096 (4 vCPU)
   *
   * @default 1024
   * @stability stable
   */
  readonly memoryLimitMiB?: number;

  /**
   * The desired number of instantiations of the task definition to keep running on the service.
   *
   * The minimum value is 1
   *
   * @default - 1
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

    // Defines the vpc, subnets and security groups
    const network = new Network(this, 'KeystoneNetwork')

    // Defines the serverless database
    const database = new Database(this, 'KeystoneDatabase', {
      vpc: network.vpc,
      subnet: network.dbSubnet,
      sg: network.dbSg,
      name: 'keystone'
    })

    // if domain name provided then get route53 zone (must be same environment!)
    let cert: acm.DnsValidatedCertificate | undefined
    let zone: route53.IHostedZone | undefined
    if (props.domainName) {
      // get the Route53 zone
      zone = route53.HostedZone.fromLookup(this, 'KeystoneZone', {
        domainName: props.domainName
      })
      // create a TLS certificate
      cert = new acm.DnsValidatedCertificate(this, 'KeystoneCert', {
        domainName: props.domainName,
        hostedZone: zone,
      })
    }

    // Defines the serverless containers
    new Compute(this, 'KeystoneCompute', {
      vpc: network.vpc,
      dbUrl: database.getUrl(),
      // pass in optional domain and cert
      domainName: props.domainName, zone, cert
    })
  }
}

