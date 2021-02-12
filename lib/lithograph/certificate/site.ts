import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";

const CERTIFICATE_REGION: string = "us-east-1";

type Props = {
  scope: cdk.Construct;
  webDomain: string;
  adminDomain: string;
  zone: route53.PublicHostedZone;
};

export class SiteCertificate {
  readonly webCertificate: certificatemanager.DnsValidatedCertificate;
  readonly adminCertificate: certificatemanager.DnsValidatedCertificate;

  constructor(props: Props) {
    this.webCertificate = new Certificate(
      props.scope,
      "WebCertificate",
      props.webDomain,
      props.zone
    );
    this.adminCertificate = new Certificate(
      props.scope,
      "AdminCertificate",
      props.adminDomain,
      props.zone
    );
  }
}

class Certificate extends certificatemanager.DnsValidatedCertificate {
  constructor(
    scope: cdk.Construct,
    id: string,
    domain: string,
    zone: route53.PublicHostedZone
  ) {
    super(scope, id, {
      domainName: domain,
      hostedZone: zone,
      validation: certificatemanager.CertificateValidation.fromDns(zone),
      region: CERTIFICATE_REGION,
    });
  }
}
