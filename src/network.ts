import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';


export class Network extends cdk.Construct {
  // the VPC for the whole stack
  public readonly vpc: ec2.IVpc
  // the database subnet
  public readonly dbSubnet: rds.ISubnetGroup
  // the database security group
  public readonly dbSg: ec2.SecurityGroup

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id)

    // Vpc with subnets in all 3 AZs
    this.vpc = new ec2.Vpc(this, 'KeystoneVPC', {
      subnetConfiguration: [
        // access load balancer from internet
        { name: 'elb_public_', subnetType: ec2.SubnetType.PUBLIC },
        // access ecs from load balancer
        { name: 'ecs_private_', subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
        // access aurora from ecs
        { name: 'aurora_isolated_', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    // Database in isolated subnet
    this.dbSubnet = new rds.SubnetGroup(this, 'KeystoneDbSubnet', {
      description: 'Subnet group for Aurora cluster',
      vpcSubnets: { subnets: this.vpc.isolatedSubnets },
      vpc: this.vpc,
    });
    this.dbSg = new ec2.SecurityGroup(this, 'KeystoneDbSg', { vpc: this.vpc });
    // allow ECS to access Aurora subnet
    this.vpc.privateSubnets.forEach((subnet) => {
      this.dbSg.addIngressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.tcp(5432));
    });

  }
}