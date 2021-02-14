import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";

type RenderProps = {
  assetDirectory: string;
  assetHandler: string;
};

type Props = {
  render: RenderProps;
};

export class ServiceLambdaFunctions {
  readonly render: lambda.IFunction;

  constructor(scope: cdk.Construct, props: Props) {
    this.render = new RenderFunction(
      scope,
      "WebRenderLambdaFunction",
      props.render
    );
  }
}

class RenderFunction extends lambda.Function {
  constructor(scope: cdk.Construct, id: string, props: RenderProps) {
    super(scope, id, {
      runtime: lambda.Runtime.GO_1_X,
      handler: props.assetHandler,
      code: lambda.Code.fromAsset(props.assetDirectory),
    });
  }
}
