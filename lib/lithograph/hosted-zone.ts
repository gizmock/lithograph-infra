import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";

export class SiteHostedZone {
  readonly hostedZone: route53.IHostedZone;

  constructor(scope: cdk.Construct, domain: string) {
    this.hostedZone = new HostedZone(scope, "HostedZone", domain);
  }
}

class HostedZone extends route53.PublicHostedZone {
  constructor(scope: cdk.Construct, id: string, domain: string) {
    super(scope, id, {
      zoneName: domain,
    });
  }
}
