import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";

const CORS_ALLOWED_METHODS = [
  s3.HttpMethods.GET,
  s3.HttpMethods.HEAD,
  s3.HttpMethods.PUT,
  s3.HttpMethods.POST,
  s3.HttpMethods.DELETE,
];

const CORS_EXPOSE_HEADERS = [
  "x-amz-server-side-encryption",
  "x-amz-request-id",
  "x-amz-id-2",
  "ETag",
  "x-amz-meta-custom-header",
];

export class WebFileBucket {
  readonly bucket: s3.IBucket;

  constructor(scope: cdk.Construct) {
    this.bucket = new Bucket(scope, "WebS3Bucket");
  }
}

class Bucket extends s3.Bucket {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // 管理画面からアップロードができるようにCORSを設定する
    // CORS example https://docs.amplify.aws/lib/storage/getting-started/q/platform/js#amazon-s3-bucket-cors-policy-setup
    this.addCorsRule({
      allowedOrigins: ["*"],
      allowedMethods: CORS_ALLOWED_METHODS,
      maxAge: 3000,
      exposedHeaders: CORS_EXPOSE_HEADERS,
      allowedHeaders: ["*"],
    });

    this.addLifecycleRule({
      // 不完全なマルチパートアップロードのオブジェクトを削除するまでの日数
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
      // ストレージクラスを自動で移す
      transitions: [
        {
          storageClass: s3.StorageClass.INTELLIGENT_TIERING,
          transitionAfter: cdk.Duration.days(1),
        },
      ],
    });
  }
}
