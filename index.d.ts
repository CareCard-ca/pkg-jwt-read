import type { Request } from 'express';
import type { JwtVerificationJwks, JwtPayload, JwtHeader } from '@carecard/auth-util';
export type { JwtPayload, JwtHeader } from '@carecard/auth-util';
export interface JwtParts {
  header: JwtHeader;
  payload: JwtPayload;
  age?: number;
}
export interface AuthenticatedRequest extends Request {
  jwt?: JwtParts | null;
}
export interface TokenRequest {
  jwt?: { payload?: JwtPayload; age?: number } | null;
}
export interface TokenRequirements {
  issuer?: string;
  subject?: string;
  audience?: string | readonly string[];
  maximumAgeSeconds?: number;
  validateClaims?: (claims: JwtPayload) => boolean;
}
export interface IntrospectionResult {
  active: boolean;
  claims?: JwtPayload;
}
export function jwtReadVerifiedToken(
  token: string,
  keys: JwtVerificationJwks,
  requirements?: TokenRequirements,
): JwtParts | null;
export function jwtReadIntrospectedToken(
  token: string,
  introspect: (token: string) => Promise<IntrospectionResult> | IntrospectionResult,
  requirements?: TokenRequirements,
): Promise<JwtParts | null>;
export function jwtReadBearerToken(header: unknown): string | null;
export function jwtGetTokenDeadline(
  payload: JwtPayload | undefined,
  maximumAgeSeconds?: number,
): number | null;
export function jwtIsTokenExpired(request: TokenRequest, maximumAgeSeconds?: number): boolean;
export function jwtGetClientId(request?: TokenRequest): string | undefined;
export function jwtGetAgeInSeconds(request?: TokenRequest): number;
export function jwtIsExpired(request?: TokenRequest | number, validitySeconds?: number): boolean;
