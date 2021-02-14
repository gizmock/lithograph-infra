import * as cdk from "@aws-cdk/core";
import * as admin from "./admin";
import { Certificates } from "./certificate";
import { WebPageTable } from "./dynamodb";
import { HostedZone } from "./hosted-zone";
import * as network from "./network";
import { WebFileBucket } from "./s3";
import * as web from "./service";

type Props = {
  domain: string;
  adminSubDomainName: string;
  adminAppSourceDirectory: string;
  webRenderAssetDirectory: string;
  webRenderAssetHandler: string;
};

export class Lithograph {
  constructor(scope: cdk.Stack, props: Props) {
    // network
    const adminDomain = props.adminSubDomainName + "." + props.domain;
    const hostedZone = new HostedZone(scope, props.domain);
    const certificates = new Certificates({
      scope: scope,
      webDomain: props.domain,
      adminDomain: adminDomain,
      zone: hostedZone.zone,
    });

    // S3
    const webFileBucket = new WebFileBucket(scope);

    // DynamoDB
    const webPageTable = new WebPageTable(scope);

    // admin
    const adminResource = new admin.AdminResource(scope, {
      domain: adminDomain,
      appSourceDirectory: props.adminAppSourceDirectory,
      zone: hostedZone.zone,
      certificate: certificates.adminCertificate,
      webFileBucket: webFileBucket.bucket,
      webPageTable: webPageTable.table,
    });

    // service
    const serviceResource = new web.ServiceResource(scope, {
      domain: props.domain,
      certificate: certificates.webCertificate,
      renderAssetDirectory: props.webRenderAssetDirectory,
      renderAssetHandler: props.webRenderAssetHandler,
      webFileBucket: webFileBucket.bucket,
      webPageTable: webPageTable.table,
    });

    // TODO delete this
    const networkStacks = new network.NetworkStacks({
      webDomain: props.domain,
      hostedZone: hostedZone.zone,
    });
    networkStacks.createDNSRecords(scope, {
      webDistrribution: serviceResource.distribution,
    });
  }
}
