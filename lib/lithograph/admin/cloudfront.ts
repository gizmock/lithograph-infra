import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";

const ROOT_PAGE_PATH: string = "/index.html";

type Props = {
  domain: string;
  bucket: s3.IBucket;
  certificate: certificatemanager.ICertificate;
};

export class AdminSpaCloudFrontDistribution {
  readonly distribution: cloudfront.IDistribution;

  constructor(scope: cdk.Construct, props: Props) {
    const identity = new OriginAccessIdentity(
      scope,
      "AdminCloudFrontIdentity",
      props.bucket
    );

    this.distribution = new Distribution(
      scope,
      "AdminCloudFrontDistribution",
      identity,
      {
        domain: props.domain,
        bucket: props.bucket,
        certificate: props.certificate,
      }
    );
  }
}

class OriginAccessIdentity extends cloudfront.OriginAccessIdentity {
  constructor(scope: cdk.Construct, id: string, bucket: s3.IBucket) {
    super(scope, id);
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        effect: iam.Effect.ALLOW,
        principals: [this.grantPrincipal],
        resources: [`${bucket.bucketArn}/*`],
      })
    );
  }
}

class Distribution extends cloudfront.CloudFrontWebDistribution {
  constructor(
    scope: cdk.Construct,
    id: string,
    identity: cloudfront.IOriginAccessIdentity,
    props: Props
  ) {
    super(scope, id, {
      errorConfigurations: [
        {
          errorCachingMinTtl: 300,
          errorCode: 403,
          responseCode: 200,
          responsePagePath: ROOT_PAGE_PATH,
        },
        {
          errorCachingMinTtl: 300,
          errorCode: 404,
          responseCode: 200,
          responsePagePath: ROOT_PAGE_PATH,
        },
      ],
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: props.bucket,
            originAccessIdentity: identity,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
            },
          ],
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      enableIpV6: true,
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
        props.certificate,
        {
          aliases: [props.domain],
        }
      ),
    });
  }
}
