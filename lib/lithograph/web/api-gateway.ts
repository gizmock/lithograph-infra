import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import * as apigatewayv2Integrations from "@aws-cdk/aws-apigatewayv2-integrations";

type RenderAPIProps = {
  readonly handler: lambda.Function;
};

export class RenderAPI extends apigatewayv2.HttpApi {
  constructor(scope: cdk.Construct, id: string, props: RenderAPIProps) {
    super(scope, id, {});
    const integration = new apigatewayv2Integrations.LambdaProxyIntegration({
      handler: props.handler,
    });
    this.addRoutes({
      path: "/",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: integration,
    });
  }
}
