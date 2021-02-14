import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { AdminDistribution, AdminOriginAccessIdentity } from "./cloudfront";
import { AdminCognito } from "./cognito";
import { AdminS3BcuketSpa } from "./s3";
import { AdminS3DeploymentSpa } from "./s3-deployment";

type Props = {
  readonly domain: string;
  readonly appSourceDirectory: string;
  readonly certificate: certificatemanager.ICertificate;
  readonly webPageTable: dynamodb.ITable;
};

export class AdminResource {
  readonly distribution: cloudfront.CloudFrontWebDistribution;
  private readonly adminCognito: AdminCognito;

  constructor(scope: cdk.Stack, props: Props) {
    const spaBucket = new AdminS3BcuketSpa(scope);

    const identity = new AdminOriginAccessIdentity(
      scope,
      "AdminCloudFrontIdentity",
      {
        bucket: spaBucket.bucket,
      }
    );

    this.distribution = new AdminDistribution(
      scope,
      "AdminCloudFrontDistribution",
      {
        domain: props.domain,
        bucket: spaBucket.bucket,
        certificate: props.certificate,
        identity: identity,
      }
    );

    new AdminS3DeploymentSpa(scope, {
      bucket: spaBucket.bucket,
      distribution: this.distribution,
      sourceDirectory: props.appSourceDirectory,
    });

    this.adminCognito = new AdminCognito(scope);
    props.webPageTable.grantReadWriteData(
      this.adminCognito.getAuthenticatedGrantee()
    );
  }

  getAuthenticatedGrantee() {
    return this.adminCognito.getAuthenticatedGrantee();
  }
}
