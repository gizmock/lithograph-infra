import * as cdk from "@aws-cdk/core";
import * as network from "./network";
import * as admin from "./admin";
import * as web from "./web";

type LithographProps = {
  readonly domain: string;
  readonly adminSubDomainName: string;
  readonly adminAppSourceDirectory: string;
  readonly webRenderAssetDirectory: string;
  readonly webRenderAssetHandler: string;
};

export class Lithograph {
  constructor(scope: cdk.Stack, props: LithographProps) {
    const adminDomain = props.adminSubDomainName + "." + props.domain;
    const networkStacks = new network.NetworkStacks(scope, {
      webDomain: props.domain,
      adminDomain: adminDomain,
    });
    const adminStacks = new admin.AdminStacks(scope, {
      domain: adminDomain,
      certificate: networkStacks.certificates.admin,
      appSourceDirectory: props.adminAppSourceDirectory,
    });
    const webStacks = new web.WebStack(scope, {
      domain: props.domain,
      certificate: networkStacks.certificates.web,
      renderAssetDirectory: props.webRenderAssetDirectory,
      renderAssetHandler: props.webRenderAssetHandler,
    });
    networkStacks.createDNSRecords(scope, {
      adminDistribution: adminStacks.distribution,
      webDistrribution: webStacks.distribution,
    });
    const adminRole = adminStacks.adminAuthenticatedRole();
    webStacks.addBucketAccessToRole(adminRole);
    webStacks.addTableReadWriteGrant(adminRole);
  }
}
