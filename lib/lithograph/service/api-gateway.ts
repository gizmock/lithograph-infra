import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import * as apigatewayv2Integrations from "@aws-cdk/aws-apigatewayv2-integrations";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";

type Props = {
  renderFunction: lambda.IFunction;
};

export class ServiceAPIGateways {
  readonly render: apigatewayv2.IHttpApi;

  constructor(scope: cdk.Construct, props: Props) {
    this.render = new RenderAPI(scope, "WebRenderAPI", props.renderFunction);
  }
}

export class RenderAPI extends apigatewayv2.HttpApi {
  constructor(scope: cdk.Construct, id: string, handler: lambda.IFunction) {
    super(scope, id, {});

    const integration = new apigatewayv2Integrations.LambdaProxyIntegration({
      handler: handler,
    });

    this.addRoutes({
      path: "/",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: integration,
    });
  }
}
