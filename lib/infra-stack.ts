import * as cdk from "@aws-cdk/core";
import * as lithograph from "./lithograph";

const CONTEXT_DOMAIN = "domain";
const ADMIN_SUB_DOMAIN_NAME = "admin";
const ADMIN_APP_SOURCE_DIRECTORY = "../lithograph-admin/build";
const WEB_RENDER_ASSET_DIRECTORY = "../lithograph-web/render/bin";
const WEB_RENDER_ASSET_HANDLER = "main";

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const domain: string = this.node.tryGetContext(CONTEXT_DOMAIN);
    new lithograph.Lithograph(this, {
      domain: domain,
      adminSubDomainName: ADMIN_SUB_DOMAIN_NAME,
      adminAppSourceDirectory: ADMIN_APP_SOURCE_DIRECTORY,
      webRenderAssetDirectory: WEB_RENDER_ASSET_DIRECTORY,
      webRenderAssetHandler: WEB_RENDER_ASSET_HANDLER,
    });
  }
}
