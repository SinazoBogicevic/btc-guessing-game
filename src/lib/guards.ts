import type { JwtHeader, VerifyErrors } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { SigningKey } from "jwks-rsa";
import jwksClient from "jwks-rsa";

const region = process.env.NEXT_PUBLIC_AWS_REGION!;
const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;

const jwksUri = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

const client = jwksClient({
  jwksUri,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000,
});

function getKey(
  header: JwtHeader,
  callback: (err: Error | null, key?: string) => void
) {
  client.getSigningKey(
    header.kid as string,
    function (err: Error | null, key: SigningKey | undefined) {
      if (err || !key) {
        callback(err || new Error("No signing key found"));
      } else {
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      }
    }
  );
}

export function verifyCognitoToken(
  token: string
): Promise<jwt.JwtPayload | string | undefined> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ["RS256"],
        issuer,
      },
      (
        err: VerifyErrors | null,
        decoded: jwt.JwtPayload | string | undefined
      ) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

export function hasMessage(err: unknown): err is { message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
  );
}
