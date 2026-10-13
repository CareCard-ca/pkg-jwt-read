import type { JwtVerificationJwks } from '@carecard/auth-util';
import {
  jwtReadVerifiedToken,
  jwtReadIntrospectedToken,
  jwtGetClientId,
  jwtGetTokenDeadline,
  jwtReadBearerToken,
  type JwtParts,
  type TokenRequirements,
} from '..';
function expectType<T>(_value: T): void {}
const requirements: TokenRequirements = {
  issuer: 'issuer',
  subject: 'subject',
  audience: ['one', 'two'],
  maximumAgeSeconds: 900,
  validateClaims: claims => claims.custom === true,
};
export function readCredential(keys: JwtVerificationJwks): void {
  const parts = jwtReadVerifiedToken('credential', keys, requirements);
  expectType<JwtParts | null>(parts);
  expectType<unknown>(parts?.payload.roles);
  expectType<string | undefined>(jwtGetClientId({ jwt: parts }));
  expectType<number | null>(jwtGetTokenDeadline({ exp: 100 }, 99));
  expectType<string | null>(jwtReadBearerToken('Bearer credential'));
  expectType<Promise<JwtParts | null>>(
    jwtReadIntrospectedToken('credential', async () => ({
      active: true,
      claims: { exp: 100, custom: 1 },
    })),
  );
}
expectType<string | undefined>(jwtGetClientId({ jwt: { payload: { sub: 'subject' } } }));
