import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";
import {
  CloudFrontDistributionIPV4ARecord,
  CloudFrontDistributionIPV6AaaaRecord,
  SiteHostedZone,
} from "./route53";

type NetworkStacksProps = {
  webDomain: string;
  adminDomain: string;
  hostedZone: SiteHostedZone;
};

export class NetworkStacks {
  private readonly webDomain: string;
  private readonly adminDomain: string;
  private readonly hostedZone: route53.PublicHostedZone;

  constructor(props: NetworkStacksProps) {
    this.webDomain = props.webDomain;
    this.adminDomain = props.adminDomain;
    this.hostedZone = props.hostedZone;
  }

  createDNSRecords(
    scope: cdk.Stack,
    props: {
      webDistrribution: cloudfront.CloudFrontWebDistribution;
      adminDistribution: cloudfront.CloudFrontWebDistribution;
    }
  ): void {
    new CloudFrontDistributionIPV4ARecord(scope, "WebDistributionAliasIPV4", {
      domain: this.webDomain,
      zone: this.hostedZone,
      distribution: props.webDistrribution,
    });
    new CloudFrontDistributionIPV6AaaaRecord(scope, "WebDistributionAlias", {
      domain: this.webDomain,
      zone: this.hostedZone,
      distribution: props.webDistrribution,
    });
    new CloudFrontDistributionIPV4ARecord(scope, "AdminDistributionAliasIPV4", {
      domain: this.adminDomain,
      zone: this.hostedZone,
      distribution: props.adminDistribution,
    });
    new CloudFrontDistributionIPV6AaaaRecord(scope, "AdminDistributionAlias", {
      domain: this.adminDomain,
      zone: this.hostedZone,
      distribution: props.adminDistribution,
    });
  }
}
