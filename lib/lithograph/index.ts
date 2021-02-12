import * as cdk from "@aws-cdk/core";
import * as network from "./network";
import * as admin from "./admin";
import * as web from "./service";
import { DynamoDBWebPage } from "./dynamodb/web-page";
import { SiteCertificate } from "./certificate/site";
import { SiteHostedZone } from "./network/route53";

type Props = {
  readonly domain: string;
  readonly adminSubDomainName: string;
  readonly adminAppSourceDirectory: string;
  readonly webRenderAssetDirectory: string;
  readonly webRenderAssetHandler: string;
};

export class Lithograph {
  constructor(scope: cdk.Stack, props: Props) {
    const adminDomain = props.adminSubDomainName + "." + props.domain;

    const hostedZone = new SiteHostedZone(scope, "HostedZone", {
      domain: props.domain,
    });

    const siteCertificate = new SiteCertificate({
      scope: scope,
      webDomain: props.domain,
      adminDomain: adminDomain,
      zone: hostedZone,
    });

    const networkStacks = new network.NetworkStacks({
      webDomain: props.domain,
      adminDomain: adminDomain,
      hostedZone: hostedZone,
    });
    const adminStacks = new admin.AdminStacks(scope, {
      domain: adminDomain,
      certificate: siteCertificate.adminCertificate,
      appSourceDirectory: props.adminAppSourceDirectory,
    });

    const dynamodbWebPage = new DynamoDBWebPage(scope);

    const webStacks = new web.ServiceStack(scope, {
      domain: props.domain,
      certificate: siteCertificate.webCertificate,
      renderAssetDirectory: props.webRenderAssetDirectory,
      renderAssetHandler: props.webRenderAssetHandler,
      dynamodbWebPage: dynamodbWebPage,
    });
    networkStacks.createDNSRecords(scope, {
      adminDistribution: adminStacks.distribution,
      webDistrribution: webStacks.distribution,
    });
    const adminRole = adminStacks.adminAuthenticatedRole();
    webStacks.addBucketAccessToRole(adminRole);
    dynamodbWebPage.grantReadWriteData(adminRole);
  }
}
