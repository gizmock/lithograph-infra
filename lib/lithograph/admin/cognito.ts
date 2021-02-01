import * as cdk from "@aws-cdk/core";
import * as cognito from "@aws-cdk/aws-cognito";
import * as iam from "@aws-cdk/aws-iam";

const COGNITO_IDENTITY_DOMAIN = "cognito-identity.amazonaws.com";
const COGNITO_STATUS_UNAUTHENTICATED = "unauthenticated";
const COGNITO_STATUS_AUTHENTICATED = "authenticated";

export class AdminUserPool extends cognito.UserPool {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, {
      selfSignUpEnabled: false,
    });
  }
}

type AdminUserPoolClientProps = {
  readonly userPool: cognito.UserPool;
};

export class AdminUserPoolClient extends cognito.UserPoolClient {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: AdminUserPoolClientProps
  ) {
    super(scope, id, {
      userPool: props.userPool,
      preventUserExistenceErrors: true,
    });
  }
}

type AdminIdentityPoolProps = {
  readonly userPool: cognito.UserPool;
  readonly userPoolClient: cognito.UserPoolClient;
};

export class AdminIdentityPool extends cognito.CfnIdentityPool {
  constructor(scope: cdk.Construct, id: string, props: AdminIdentityPoolProps) {
    super(scope, id, {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: props.userPoolClient.userPoolClientId,
          providerName: props.userPool.userPoolProviderName,
        },
      ],
    });
  }
}

type IdentityRoleProps = {
  readonly identityPool: cognito.CfnIdentityPool;
};

export class AdminUnauthenticatedRole extends iam.Role {
  constructor(scope: cdk.Construct, id: string, props: IdentityRoleProps) {
    super(scope, id, {
      assumedBy: new iam.FederatedPrincipal(
        COGNITO_IDENTITY_DOMAIN,
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": props.identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": COGNITO_STATUS_UNAUTHENTICATED,
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });
    this.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["mobileanalytics:PutEvents", "cognito-sync:*"],
        resources: ["*"],
      })
    );
  }
}

export class AdminAuthenticatedRole extends iam.Role {
  constructor(scope: cdk.Construct, id: string, props: IdentityRoleProps) {
    super(scope, id, {
      assumedBy: new iam.FederatedPrincipal(
        COGNITO_IDENTITY_DOMAIN,
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": props.identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": COGNITO_STATUS_AUTHENTICATED,
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });
    this.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*",
        ],
        resources: ["*"],
      })
    );
  }
}

type IdentityRoleAttachementProps = {
  readonly identityPool: cognito.CfnIdentityPool;
  readonly unauthenticatedRole: iam.Role;
  readonly authenticatedRole: iam.Role;
};

export class AdminIdentityRoleAttachement extends cognito.CfnIdentityPoolRoleAttachment {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: IdentityRoleAttachementProps
  ) {
    super(scope, id, {
      identityPoolId: props.identityPool.ref,
      roles: {
        unauthenticated: props.unauthenticatedRole.roleArn,
        authenticated: props.authenticatedRole.roleArn,
      },
    });
  }
}
