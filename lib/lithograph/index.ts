import * as cdk from "@aws-cdk/core";
import { createAdminResources } from "./admin";
import { Certificates } from "./certificate";
import { WebPageTable } from "./dynamodb";
import { HostedZone } from "./hosted-zone";
import { WebFileBucket } from "./s3";
import { createServiceResources } from "./service";

type Props = {
  domain: string;
  adminSubDomainName: string;
  adminAppSourceDirectory: string;
  webRenderAssetDirectory: string;
  webRenderAssetHandler: string;
};

export class Lithograph {
  constructor(scope: cdk.Stack, props: Props) {
    // Network
    const hostedZone = new HostedZone(scope, props.domain);
    const adminDomain = props.adminSubDomainName + "." + props.domain;
    const certificates = new Certificates({
      scope: scope,
      webDomain: props.domain,
      adminDomain: adminDomain,
      zone: hostedZone.zone,
    });
    // Storage
    const webFileBucket = new WebFileBucket(scope);
    // Database
    const webPageTable = new WebPageTable(scope);

    // admin
    createAdminResources(scope, {
      domain: adminDomain,
      appSourceDirectory: props.adminAppSourceDirectory,
      zone: hostedZone.zone,
      certificate: certificates.adminCertificate,
      webFileBucket: webFileBucket.bucket,
      webPageTable: webPageTable.table,
    });

    // service
    createServiceResources(scope, {
      domain: props.domain,
      zone: hostedZone.zone,
      certificate: certificates.webCertificate,
      webFileBucket: webFileBucket.bucket,
      webPageTable: webPageTable.table,
      renderAssetDirectory: props.webRenderAssetDirectory,
      renderAssetHandler: props.webRenderAssetHandler,
    });
  }
}
