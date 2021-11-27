import * as cdk from "@aws-cdk/core"

import { Keystone, KeystoneProps } from "../src"

export interface KeystoneStackProps extends cdk.StackProps, KeystoneProps { }

export class KeystoneStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: KeystoneStackProps) {
    super(scope, id, props)

    new Keystone(this, 'Keystone', {
      cpu: props.cpu
    })

  }
}