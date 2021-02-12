import * as cdk from "@aws-cdk/core";
import * as cognito from "@aws-cdk/aws-cognito";
import * as iam from "@aws-cdk/aws-iam";

const COGNITO_IDENTITY_DOMAIN = "cognito-identity.amazonaws.com";
const COGNITO_STATUS_UNAUTHENTICATED = "unauthenticated";
const COGNITO_STATUS_AUTHENTICATED = "authenticated";

export class AdminCognito {
  private readonly userPool: cognito.UserPool;
  private readonly userPoolClient: cognito.UserPoolClient;
  private readonly identityPool: cognito.CfnIdentityPool;
  private readonly unauthenticatedRole: iam.Role;
  private readonly authenticatedRole: iam.Role;

  constructor(scope: cdk.Construct) {
    this.userPool = new AdminUserPool(scope, "AdminCognitoUserPool");
    this.userPoolClient = new AdminUserPoolClient(
      scope,
      "AdminCognitoUserPoolClient",
      this.userPool
    );

    this.identityPool = new AdminIdentityPool(
      scope,
      "AdminCognitoIdentityPool",
      this.userPool,
      this.userPoolClient
    );

    this.unauthenticatedRole = new AdminUnauthenticatedRole(
      scope,
      "AdminCognitoIdentityUnauthenticatedRole",
      this.identityPool
    );

    this.authenticatedRole = new AdminAuthenticatedRole(
      scope,
      "AdminCognitoIdentityAuthenticatedRole",
      this.identityPool
    );

    new AdminIdentityRoleAttachement(
      scope,
      "AdminCognitoIdentityRoleAttachment",
      {
        identityPool: this.identityPool,
        unauthenticatedRole: this.unauthenticatedRole,
        authenticatedRole: this.authenticatedRole,
      }
    );
  }

  getAuthenticatedGrantee(): iam.IGrantable {
    return this.authenticatedRole;
  }
}

class AdminUserPool extends cognito.UserPool {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, {
      selfSignUpEnabled: false,
    });
  }
}

class AdminUserPoolClient extends cognito.UserPoolClient {
  constructor(scope: cdk.Construct, id: string, userPool: cognito.IUserPool) {
    super(scope, id, {
      userPool: userPool,
      preventUserExistenceErrors: true,
    });
  }
}

class AdminIdentityPool extends cognito.CfnIdentityPool {
  constructor(
    scope: cdk.Construct,
    id: string,
    userPool: cognito.UserPool,
    userPoolClient: cognito.UserPoolClient
  ) {
    super(scope, id, {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });
  }
}

class AdminUnauthenticatedRole extends iam.Role {
  constructor(
    scope: cdk.Construct,
    id: string,
    identityPool: cognito.CfnIdentityPool
  ) {
    super(scope, id, {
      assumedBy: new iam.FederatedPrincipal(
        COGNITO_IDENTITY_DOMAIN,
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
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

class AdminAuthenticatedRole extends iam.Role {
  constructor(
    scope: cdk.Construct,
    id: string,
    identityPool: cognito.CfnIdentityPool
  ) {
    super(scope, id, {
      assumedBy: new iam.FederatedPrincipal(
        COGNITO_IDENTITY_DOMAIN,
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
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

class AdminIdentityRoleAttachement extends cognito.CfnIdentityPoolRoleAttachment {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: {
      identityPool: cognito.CfnIdentityPool;
      unauthenticatedRole: iam.Role;
      authenticatedRole: iam.Role;
    }
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
