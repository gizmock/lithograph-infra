import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";
import { AdminSpaCloudFrontDistribution } from "./cloudfront";
import { AdminCognito } from "./cognito";
import { createAdminDNSRecords } from "./route53";
import { AdminS3BcuketSpa } from "./s3";
import { addAdminSpaBucketDeployment } from "./s3-deployment";

type Props = {
  domain: string;
  appSourceDirectory: string;
  certificate: certificatemanager.ICertificate;
  zone: route53.IHostedZone;
  webPageTable: dynamodb.ITable;
};

export class AdminResource {
  private readonly adminCognito: AdminCognito;
  private readonly spaDistribution: AdminSpaCloudFrontDistribution;

  constructor(scope: cdk.Stack, props: Props) {
    const spaBucket = new AdminS3BcuketSpa(scope);

    this.spaDistribution = new AdminSpaCloudFrontDistribution(scope, {
      domain: props.domain,
      bucket: spaBucket.bucket,
      certificate: props.certificate,
    });

    addAdminSpaBucketDeployment(scope, {
      bucket: spaBucket.bucket,
      distribution: this.spaDistribution.distribution,
      sourceDirectory: props.appSourceDirectory,
    });

    createAdminDNSRecords(scope, {
      domain: props.domain,
      zone: props.zone,
      distribution: this.spaDistribution.distribution,
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
