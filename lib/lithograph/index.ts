import * as cdk from "@aws-cdk/core";
import { createAdminResources } from "./admin";
import { Certificates } from "./certificate";
import { WebPageTable } from "./dynamodb";
import { HostedZone } from "./hosted-zone";
import { WebFileBucket } from "./s3";
import { createServiceResources } from "./service";

type Props = {
  serviceDomain: string;
  adminDomain: string;
  adminAppSourceDirectory: string;
  webRenderAssetDirectory: string;
  webRenderAssetHandler: string;
};

export class Lithograph {
  constructor(scope: cdk.Stack, props: Props) {
    // DNS
    const hostedZone = new HostedZone(scope, props.serviceDomain);
    const certificates = new Certificates(scope, {
      serviceDomain: props.serviceDomain,
      adminDomain: props.adminDomain,
      zone: hostedZone.zone,
    });
    // Storage
    const webFileBucket = new WebFileBucket(scope);
    // Database
    const webPageTable = new WebPageTable(scope);

    // admin
    createAdminResources(scope, {
      domain: props.adminDomain,
      appSourceDirectory: props.adminAppSourceDirectory,
      zone: hostedZone.zone,
      certificate: certificates.admin,
      webFileBucket: webFileBucket.bucket,
      webPageTable: webPageTable.table,
    });

    // service
    createServiceResources(scope, {
      domain: props.serviceDomain,
      zone: hostedZone.zone,
      certificate: certificates.service,
      webFileBucket: webFileBucket.bucket,
      webPageTable: webPageTable.table,
      renderAssetDirectory: props.webRenderAssetDirectory,
      renderAssetHandler: props.webRenderAssetHandler,
    });
  }
}
