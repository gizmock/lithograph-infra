import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { DynamoDBWebPage } from "../dynamodb";
import { RenderAPI } from "./api-gateway";
import { WebDistribution, WebOriginAccessIdentity } from "./cloudfront";
import { RenderFunction } from "./lambda";
import { WebBucket } from "./s3";

type Props = {
  readonly domain: string;
  readonly certificate: certificatemanager.ICertificate;
  readonly renderAssetDirectory: string;
  readonly renderAssetHandler: string;
  readonly dynamodbWebPage: DynamoDBWebPage;
};

export class ServiceResource {
  readonly bucket: s3.Bucket;
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
    this.bucket = new WebBucket(scope, "WebS3Bucket");
    const identity = new WebOriginAccessIdentity(
      scope,
      "WebCloudFrontIdentity",
      {
        bucket: this.bucket,
      }
    );
    this.distribution = new WebDistribution(
      scope,
      "WebCloudFrontDistribution",
      {
        domain: props.domain,
        bucket: this.bucket,
        certificate: props.certificate,
        renderAPI: this.renderAPI,
        identity: identity,
      }
    );
    props.dynamodbWebPage.grantReadData(this.renderFunction.grantPrincipal);
  }

  addBucketAccessToRole(grantee: iam.IGrantable): void {
    const bucket = this.bucket;
    bucket.grantReadWrite(grantee);
  }
}
