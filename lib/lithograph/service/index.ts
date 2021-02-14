import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { RenderAPI } from "./api-gateway";
import { WebDistribution, WebOriginAccessIdentity } from "./cloudfront";
import { RenderFunction } from "./lambda";

type Props = {
  domain: string;
  certificate: certificatemanager.ICertificate;
  renderAssetDirectory: string;
  renderAssetHandler: string;
  webFileBucket: s3.IBucket;
  webPageTable: dynamodb.ITable;
};

export class ServiceResource {
  readonly renderFunction: lambda.Function;
  readonly renderAPI: apigatewayv2.HttpApi;
  readonly distribution: cloudfront.CloudFrontWebDistribution;

  constructor(scope: cdk.Stack, props: Props) {
    this.renderFunction = new RenderFunction(scope, "WebRenderLambdaFunction", {
      assetDirectory: props.renderAssetDirectory,
      assetHandler: props.renderAssetHandler,
    });

    this.renderAPI = new RenderAPI(scope, "WebRenderAPI", {
      handler: this.renderFunction,
    });

    const identity = new WebOriginAccessIdentity(
      scope,
      "WebCloudFrontIdentity",
      {
        bucket: props.webFileBucket,
      }
    );

    this.distribution = new WebDistribution(
      scope,
      "WebCloudFrontDistribution",
      {
        domain: props.domain,
        bucket: props.webFileBucket,
        certificate: props.certificate,
        renderAPI: this.renderAPI,
        identity: identity,
      }
    );
    props.webPageTable.grantReadData(this.renderFunction.grantPrincipal);
  }
}
