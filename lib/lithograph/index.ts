import * as cdk from "@aws-cdk/core";
import * as admin from "./admin";
import { Certificates } from "./certificate";
import { DynamoDBWebPage } from "./dynamodb";
import { HostedZone } from "./hosted-zone";
import * as network from "./network";
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
    const networkStacks = new network.NetworkStacks({
      webDomain: props.domain,
      adminDomain: adminDomain,
      hostedZone: hostedZone.zone,
    });

    // DynamoDB
    const dynamodbWebPage = new DynamoDBWebPage(scope);

    // admin
    const adminResource = new admin.AdminResource(scope, {
      domain: adminDomain,
      certificate: certificates.adminCertificate,
      appSourceDirectory: props.adminAppSourceDirectory,
      webPageTable: dynamodbWebPage.table,
    });

    // service
    const serviceResource = new web.ServiceResource(scope, {
      domain: props.domain,
      certificate: certificates.webCertificate,
      renderAssetDirectory: props.webRenderAssetDirectory,
      renderAssetHandler: props.webRenderAssetHandler,
      webPageTable: dynamodbWebPage.table,
    });
    networkStacks.createDNSRecords(scope, {
      adminDistribution: adminResource.distribution,
      webDistrribution: serviceResource.distribution,
    });
    serviceResource.addBucketAccessToRole(
      adminResource.getAuthenticatedGrantee()
    );
  }
}
