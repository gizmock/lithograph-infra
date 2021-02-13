import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";

export class HostedZone {
  readonly zone: route53.IHostedZone;

  constructor(scope: cdk.Construct, domain: string) {
    this.zone = new Zone(scope, "HostedZone", domain);
  }
}

class Zone extends route53.PublicHostedZone {
  constructor(scope: cdk.Construct, id: string, domain: string) {
    super(scope, id, {
      zoneName: domain,
    });
  }
}
