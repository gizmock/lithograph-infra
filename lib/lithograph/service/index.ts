import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { WebDistribution, WebOriginAccessIdentity } from "./cloudfront";
import { ServiceLambdaFunctions } from "./lambda";
import { ServiceAPIGateways } from "./api-gateway";

type Props = {
  domain: string;
  certificate: certificatemanager.ICertificate;
  webFileBucket: s3.IBucket;
  webPageTable: dynamodb.ITable;
  renderAssetDirectory: string;
  renderAssetHandler: string;
};

export class ServiceResource {
  readonly distribution: cloudfront.CloudFrontWebDistribution;

  constructor(scope: cdk.Stack, props: Props) {
    const functions = new ServiceLambdaFunctions(scope, {
      render: {
        assetDirectory: props.renderAssetDirectory,
        assetHandler: props.renderAssetHandler,
      },
    });
    props.webPageTable.grantReadData(functions.render.grantPrincipal);

    const apis = new ServiceAPIGateways(scope, {
      renderFunction: functions.render,
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
        renderAPI: apis.render,
        identity: identity,
      }
    );
  }
}
