import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
import * as dynamodb from "@aws-cdk/aws-dynamodb";

import { WebBucket } from "./s3";
import { WebDistribution, WebOriginAccessIdentity } from "./cloudfront";
import { RenderFunction } from "./lambda";
import { RenderAPI } from "./api-gateway";
import { WebSiteSettingTable, WebPageTable } from "./dynamodb";

type WebStackProps = {
  readonly domain: string;
  readonly certificate: certificatemanager.DnsValidatedCertificate;
  readonly renderAssetDirectory: string;
  readonly renderAssetHandler: string;
};

export class WebStack {
  readonly bucket: s3.Bucket;
  readonly renderFunction: lambda.Function;
  readonly renderAPI: apigatewayv2.HttpApi;
  readonly distribution: cloudfront.CloudFrontWebDistribution;
  readonly siteSettingTable: dynamodb.Table;
  readonly pageTable: dynamodb.Table;

  constructor(scope: cdk.Stack, props: WebStackProps) {
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
    this.siteSettingTable = new WebSiteSettingTable(
      scope,
      "WebSiteSettingTable"
    );
    this.siteSettingTable.grantReadData(this.renderFunction.grantPrincipal);
    this.pageTable = new WebPageTable(scope, "WebPageTable");
    this.pageTable.grantReadData(this.renderFunction.grantPrincipal);
  }

  addBucketAccessToRole(grantee: iam.IGrantable): void {
    const bucket = this.bucket;
    bucket.grantReadWrite(grantee);
  }

  addTableReadWriteGrant(grantee: iam.IGrantable) {
    this.siteSettingTable.grantReadWriteData(grantee);
    this.pageTable.grantReadWriteData(grantee);
  }
}
