import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as route53 from "@aws-cdk/aws-route53";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { ServiceAPIGateways } from "./api-gateway";
import { ServiceDistribution } from "./cloudfront";
import { ServiceLambdaFunctions } from "./lambda";
import { createServiceDNSRecords } from "./route53";

type Props = {
  domain: string;
  zone: route53.IHostedZone;
  certificate: certificatemanager.ICertificate;
  webFileBucket: s3.IBucket;
  webPageTable: dynamodb.ITable;
  renderAssetDirectory: string;
  renderAssetHandler: string;
};

export function createServiceResources(scope: cdk.Stack, props: Props) {
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

  const distribution = new ServiceDistribution(scope, {
    domain: props.domain,
    bucket: props.webFileBucket,
    certificate: props.certificate,
    renderAPI: apis.render,
  });

  createServiceDNSRecords(scope, {
    domain: props.domain,
    zone: props.zone,
    distribution: distribution.distribution,
  });
}
