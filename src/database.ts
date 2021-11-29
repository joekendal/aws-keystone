import * as cdk from '@aws-cdk/core'
import * as rds from '@aws-cdk/aws-rds';
import * as ec2 from '@aws-cdk/aws-ec2';


export interface DatabaseProps {
  // the VPC for the database to reside in
  vpc: ec2.IVpc
  // the aurora auto-scaling config
  scaling?: rds.ServerlessScalingOptions
  // the subnet for the database to reside in
  subnet: rds.ISubnetGroup
  // the name of the default database
  name: string
  // the security group for the database
  sg: ec2.SecurityGroup
}

export class Database extends cdk.Construct {
  // the aurora cluster
  public readonly cluster: rds.ServerlessCluster
  // the db name
  private readonly name: string
  // the db username
  private readonly username: string
  // the db password
  private readonly password: string
  // the db hostname
  private readonly hostname: string
  // the db port
  private readonly port: number

  constructor(scope: cdk.Construct, id: string, props: DatabaseProps) {
    super(scope, id)
    this.name = props.name
    // generate password
    const creds = rds.Credentials.fromGeneratedSecret('keystone');

    // create aurora cluster
    this.cluster = new rds.ServerlessCluster(this, 'KeystoneDatabase', {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql10'),
      vpc: props.vpc,
      scaling: props.scaling ?? {
        autoPause: cdk.Duration.minutes(10),
      },
      credentials: creds,
      subnetGroup: props.subnet,
      defaultDatabaseName: props.name,
      securityGroups: [props.sg],
    });

    // set db values
    this.username = creds.username
    this.password = this.cluster.secret!.secretValueFromJson('password').toString()
    this.hostname = this.cluster.clusterEndpoint.hostname
    this.port = 5432
  }

  // construct the postgresql connection url
  public getUrl() {
    return cdk.Fn.join('', [
      'postgres://', this.username, ':', this.password,
      '@', this.hostname, ':', this.port.toString(),
      '/', this.name, '?connect_timeout=300'
    ])
  }
}