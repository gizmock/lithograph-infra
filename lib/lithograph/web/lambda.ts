import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";

type RenderFunctionProps = {
  readonly assetDirectory: string;
  readonly assetHandler: string;
};

export class RenderFunction extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, props: RenderFunctionProps) {
    super(scope, id, {
      runtime: lambda.Runtime.GO_1_X,
      handler: props.assetHandler,
      code: lambda.Code.fromAsset(props.assetDirectory),
    });
  }
}
