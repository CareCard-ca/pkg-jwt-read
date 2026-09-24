import type { JwtVerificationJwks } from '@carecard/auth-util';
import type { NextFunction, Response } from 'express';
import {
  jwtGetApplicationContext,
  jwtHasApplicationAudience,
  jwtReadApplicationToken,
  jwtValidateAndExtractApplication,
  jwtValidateAndExtractApplicationOrServerAuth,
  jwtVerifyApplication,
  jwtVerifyApplicationOrServerAuth,
  jwtVerifyApplicationOrServerAuthAndHasRole,
} from '../index';
import type { AuthenticatedRequest, ServerAuthIntrospector } from '../index';

export function readApplicationAudience(
  token: string,
  keys: JwtVerificationJwks,
): string | undefined {
  jwtHasApplicationAudience({ aud: 'example-application' }, 'example-application');
  return jwtReadApplicationToken(token, keys, 'example-application')?.payload.aud;
}

export async function authenticateApplicationRequest(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
  keys: JwtVerificationJwks,
  introspector: ServerAuthIntrospector,
): Promise<string> {
  jwtValidateAndExtractApplication(request, keys, 'example-application');
  await jwtValidateAndExtractApplicationOrServerAuth(
    request,
    keys,
    'example-application',
    introspector,
  );
  jwtVerifyApplication(keys, 'example-application')(request, response, next);
  await jwtVerifyApplicationOrServerAuth(keys, 'example-application', introspector)(
    request,
    response,
    next,
  );
  await jwtVerifyApplicationOrServerAuthAndHasRole(
    'ad',
    keys,
    'example-application',
    introspector,
  )(request, response, next);
  return jwtGetApplicationContext(request).application_namespace;
}
