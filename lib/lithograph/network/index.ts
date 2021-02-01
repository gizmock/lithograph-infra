import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";

import {
  CloudFrontDistributionIPV4ARecord,
  CloudFrontDistributionIPV6AaaaRecord,
  SiteHostedZone,
} from "./route53";
import { SiteCertificate } from "./certificate";

type NetworkStacksProps = {
  readonly webDomain: string;
  readonly adminDomain: string;
};

type DNSRecordsProps = {
  readonly webDistrribution: cloudfront.CloudFrontWebDistribution;
  readonly adminDistribution: cloudfront.CloudFrontWebDistribution;
};

export class NetworkStacks {
  private readonly zone: route53.PublicHostedZone;
  private readonly webDomain: string;
  private readonly adminDomain: string;

  readonly certificates: {
    readonly admin: certificatemanager.DnsValidatedCertificate;
    readonly web: certificatemanager.DnsValidatedCertificate;
  };

  constructor(scope: cdk.Stack, props: NetworkStacksProps) {
    this.zone = new SiteHostedZone(scope, "HostedZone", {
      domain: props.webDomain,
    });
    this.webDomain = props.webDomain;
    this.adminDomain = props.adminDomain;
    this.certificates = {
      web: new SiteCertificate(scope, "WebCertificate", {
        domain: this.webDomain,
        zone: this.zone,
      }),
      admin: new SiteCertificate(scope, "AdminCertificate", {
        domain: this.adminDomain,
        zone: this.zone,
      }),
    };
  }

  createDNSRecords(scope: cdk.Stack, props: DNSRecordsProps): void {
    new CloudFrontDistributionIPV4ARecord(scope, "WebDistributionAliasIPV4", {
      domain: this.webDomain,
      zone: this.zone,
      distribution: props.webDistrribution,
    });
    new CloudFrontDistributionIPV6AaaaRecord(scope, "WebDistributionAlias", {
      domain: this.webDomain,
      zone: this.zone,
      distribution: props.webDistrribution,
    });
    new CloudFrontDistributionIPV4ARecord(scope, "AdminDistributionAliasIPV4", {
      domain: this.adminDomain,
      zone: this.zone,
      distribution: props.adminDistribution,
    });
    new CloudFrontDistributionIPV6AaaaRecord(scope, "AdminDistributionAlias", {
      domain: this.adminDomain,
      zone: this.zone,
      distribution: props.adminDistribution,
    });
  }
}
