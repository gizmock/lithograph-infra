import * as cdk from "@aws-cdk/core";
import * as admin from "./admin";
import { SiteCertificate } from "./certificate/site";
import { DynamoDBWebPage } from "./dynamodb/web-page";
import { SiteHostedZone } from "./hosted-zone";
import * as network from "./network";
import * as web from "./service";

type Props = {
  readonly domain: string;
  readonly adminSubDomainName: string;
  readonly adminAppSourceDirectory: string;
  readonly webRenderAssetDirectory: string;
  readonly webRenderAssetHandler: string;
};

export class Lithograph {
  constructor(scope: cdk.Stack, props: Props) {
    // network
    const adminDomain = props.adminSubDomainName + "." + props.domain;
    const siteHostedZone = new SiteHostedZone(scope, props.domain);
    const siteCertificate = new SiteCertificate({
      scope: scope,
      webDomain: props.domain,
      adminDomain: adminDomain,
      zone: siteHostedZone.hostedZone,
    });
    const networkStacks = new network.NetworkStacks({
      webDomain: props.domain,
      adminDomain: adminDomain,
      hostedZone: siteHostedZone.hostedZone,
    });

    // database
    const dynamodbWebPage = new DynamoDBWebPage(scope);

    // admin
    const adminResource = new admin.AdminResource(scope, {
      domain: adminDomain,
      certificate: siteCertificate.adminCertificate,
      appSourceDirectory: props.adminAppSourceDirectory,
    });
    const adminGrantee = adminResource.getAuthenticatedGrantee();
    dynamodbWebPage.grantReadWriteData(adminGrantee);

    // service
    const serviceResource = new web.ServiceResource(scope, {
      domain: props.domain,
      certificate: siteCertificate.webCertificate,
      renderAssetDirectory: props.webRenderAssetDirectory,
      renderAssetHandler: props.webRenderAssetHandler,
      dynamodbWebPage: dynamodbWebPage,
    });
    networkStacks.createDNSRecords(scope, {
      adminDistribution: adminResource.distribution,
      webDistrribution: serviceResource.distribution,
    });
    serviceResource.addBucketAccessToRole(adminGrantee);
  }
}
