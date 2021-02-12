import * as cdk from "@aws-cdk/core";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";

const ROOT_PAGE_PATH: string = "/index.html";

type AdminOriginAccessIdentityProps = {
  readonly bucket: s3.Bucket;
};

export class AdminOriginAccessIdentity extends cloudfront.OriginAccessIdentity {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: AdminOriginAccessIdentityProps
  ) {
    super(scope, id);
    props.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        effect: iam.Effect.ALLOW,
        principals: [this.grantPrincipal],
        resources: [`${props.bucket.bucketArn}/*`],
      })
    );
  }
}

type AdminDistributionProps = {
  readonly domain: string;
  readonly bucket: s3.Bucket;
  readonly certificate: certificatemanager.ICertificate;
  readonly identity: cloudfront.OriginAccessIdentity;
};

export class AdminDistribution extends cloudfront.CloudFrontWebDistribution {
  constructor(scope: cdk.Construct, id: string, props: AdminDistributionProps) {
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
            originAccessIdentity: props.identity,
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
