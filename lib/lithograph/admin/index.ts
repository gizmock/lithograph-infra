import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as route53 from "@aws-cdk/aws-route53";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { AdminConsoleDistribution } from "./cloudfront";
import { AdminCognito } from "./cognito";
import { createAdminDNSRecords } from "./route53";
import { AdminConsoleBcuket } from "./s3";
import { addAdminConsoleBucketDeployment } from "./s3-deployment";

type Props = {
  domain: string;
  appSourceDirectory: string;
  certificate: certificatemanager.ICertificate;
  zone: route53.IHostedZone;
  webFileBucket: s3.IBucket;
  webPageTable: dynamodb.ITable;
};

export class AdminResource {
  constructor(scope: cdk.Stack, props: Props) {
    const consoleBucket = new AdminConsoleBcuket(scope);

    const consoleDistribution = new AdminConsoleDistribution(scope, {
      domain: props.domain,
      bucket: consoleBucket.bucket,
      certificate: props.certificate,
    });

    addAdminConsoleBucketDeployment(scope, {
      bucket: consoleBucket.bucket,
      distribution: consoleDistribution.distribution,
      sourceDirectory: props.appSourceDirectory,
    });

    createAdminDNSRecords(scope, {
      domain: props.domain,
      zone: props.zone,
      distribution: consoleDistribution.distribution,
    });

    const adminCognito = new AdminCognito(scope);
    const authenticatedGrantee = adminCognito.getAuthenticatedGrantee();
    props.webFileBucket.grantReadWrite(authenticatedGrantee);
    props.webPageTable.grantReadWriteData(authenticatedGrantee);
  }
}
