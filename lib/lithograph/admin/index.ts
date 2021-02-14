import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as route53 from "@aws-cdk/aws-route53";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { AdminConsoleDistribution } from "./cloudfront";
import { AdminCognito } from "./cognito";
import { createAdminDNSRecords } from "./route53";
import { AdminConsoleBcuket } from "./s3";
import { createAdminConsoleBucketDeployment } from "./s3-deployment";

type Props = {
  domain: string;
  appSourceDirectory: string;
  certificate: certificatemanager.ICertificate;
  zone: route53.IHostedZone;
  webFileBucket: s3.IBucket;
  webPageTable: dynamodb.ITable;
};

export function createAdminResources(scope: cdk.Stack, props: Props) {
  const bucket = new AdminConsoleBcuket(scope);

  const distribution = new AdminConsoleDistribution(scope, {
    domain: props.domain,
    bucket: bucket.bucket,
    certificate: props.certificate,
  });

  createAdminConsoleBucketDeployment(scope, {
    bucket: bucket.bucket,
    distribution: distribution.distribution,
    sourceDirectory: props.appSourceDirectory,
  });

  createAdminDNSRecords(scope, {
    domain: props.domain,
    zone: props.zone,
    distribution: distribution.distribution,
  });

  const cognito = new AdminCognito(scope);
  props.webFileBucket.grantReadWrite(cognito.authenticatedRole);
  props.webPageTable.grantReadWriteData(cognito.authenticatedRole);
}
