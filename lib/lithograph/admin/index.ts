import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { AdminDistribution, AdminOriginAccessIdentity } from "./cloudfront";
import { AdminCognito } from "./cognito";
import { AdminBucket, AdminBucketDeployment } from "./s3";

type Props = {
  readonly domain: string;
  readonly appSourceDirectory: string;
  readonly certificate: certificatemanager.ICertificate;
};

export class AdminResource {
  readonly bucket: s3.Bucket;
  readonly distribution: cloudfront.CloudFrontWebDistribution;
  private readonly adminCognito: AdminCognito;

  constructor(scope: cdk.Stack, props: Props) {
    this.bucket = new AdminBucket(scope, "AdminS3Bucket");
    const identity = new AdminOriginAccessIdentity(
      scope,
      "AdminCloudFrontIdentity",
      {
        bucket: this.bucket,
      }
    );
    this.distribution = new AdminDistribution(
      scope,
      "AdminCloudFrontDistribution",
      {
        domain: props.domain,
        bucket: this.bucket,
        certificate: props.certificate,
        identity: identity,
      }
    );
    new AdminBucketDeployment(scope, "AdminS3Deploy", {
      bucket: this.bucket,
      distribution: this.distribution,
      sourceDirectory: props.appSourceDirectory,
    });

    this.adminCognito = new AdminCognito(scope);
  }

  getAuthenticatedGrantee() {
    return this.adminCognito.getAuthenticatedGrantee();
  }
}
