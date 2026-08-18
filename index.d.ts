/**
 * Utility functions for authentication and authorization in the CareCard ecosystem.
 */

import type { NextFunction, Request, Response } from 'express';

export const DEFAULT_USER_AUTHORIZATION_HEADER_NAME: 'X-Authorization-Context';
export const DEFAULT_USER_AUTHORIZATION_MAX_TOKEN_LENGTH: 2048;

/**
 * Represents the standard JWT header structure.
 */
export interface JwtHeader {
  /** The cryptographic algorithm used to secure the JWT. */
  alg?: string;
  /** The media type of the JWT. Defaults to 'JWT'. */
  typ?: string;
  /** Any other custom header fields. */
  [key: string]: unknown;
}

/**
 * Represents the standard JWT payload (claims) structure.
 */
export interface JwtPayload {
  /** Issued at time, in seconds since the epoch. */
  iat?: number;
  /** Expiration time, in seconds since the epoch. */
  exp?: number;
  /** Not before time, in seconds since the epoch. */
  nbf?: number;
  /** Authentication time, in seconds since the epoch. */
  auth_time?: number;
  /** Subject (usually the client ID). */
  sub?: string;
  /** Roles assigned to the user. */
  roles?: string[];
  /** Authentication mode used by app-facing services. */
  authMode?: 'jwt' | 'server-auth' | string;
  /** Server-auth session identifier when an opaque server-auth token was used. */
  sessionId?: string;
  /** Any other custom payload fields. */
  [key: string]: unknown;
}

/**
 * Represents the compact authorization-context JWT claims issued for scoped resource access.
 */
export interface UserAuthorizationPayload extends JwtPayload {
  typ?: string;
  iss?: string;
  aud?: string | string[];
  schema?: string;
  table?: string;
  actions?: string[];
  scopeType?: string;
  scopeId?: string | null;
  authzVersion?: string;
  jti?: string;
}

/**
 * Container for the decoded header and payload of a JWT.
 */
export interface JwtParts {
  /** Decoded JWT header. */
  header: JwtHeader;
  /** Decoded JWT payload. */
  payload: JwtPayload;
}

/**
 * Structure of the JWT object attached to the request.
 */
export interface JwtRequestObject {
  header: JwtHeader;
  payload: JwtPayload;
  age?: number;
  jwtClientId: (req?: JwtRequestContext) => string | undefined;
  doesJwtUserHasRole: (role: string) => boolean;
  isJwtExpired: (jwtValiditySeconds?: number) => boolean;
  jwtAgeInSeconds: (req?: JwtRequestContext) => number;
}

/**
 * Structure of the visitor object attached to the request.
 */
export interface VisitorRequestObject {
  header: JwtHeader;
  payload: JwtPayload;
  visitorClientId: (req?: JwtRequestContext) => string | undefined;
}

/**
 * Structure of the scoped authorization object attached to the request.
 */
export interface UserAuthorizationRequestObject {
  header: JwtHeader;
  payload: UserAuthorizationPayload;
}

export interface JwtRequestContext {
  jwt?: {
    header?: JwtHeader;
    payload: JwtPayload;
    age?: number;
    jwtClientId?: JwtRequestObject['jwtClientId'];
    doesJwtUserHasRole?: JwtRequestObject['doesJwtUserHasRole'];
    isJwtExpired?: JwtRequestObject['isJwtExpired'];
    jwtAgeInSeconds?: JwtRequestObject['jwtAgeInSeconds'];
  } | null;
  visitor?: {
    header?: JwtHeader;
    payload: JwtPayload;
    visitorClientId?: VisitorRequestObject['visitorClientId'];
  } | null;
  userAuthorization?: UserAuthorizationRequestObject | null;
}

export interface UserAuthorizationTokenOptions {
  publicKey?: string;
  headerName?: string;
  maxTokenLength?: number;
  expectedType?: string;
  expectedIssuer?: string;
  expectedAudience?: string | string[];
}

export interface UserAuthorizationReadOptions {
  userAuthorization?: UserAuthorizationTokenOptions;
}

/**
 * Extended Express Request to include jwt, visitor, and userAuthorization objects.
 */
export interface AuthenticatedRequest extends Request, JwtRequestContext {
  jwt?: JwtRequestObject | null;
  visitor?: VisitorRequestObject | null;
  userAuthorization?: UserAuthorizationRequestObject | null;
}

export interface ServerAuthIntrospectionClaims {
  valid?: boolean;
  sub?: string;
  userId?: string;
  user_id?: string;
  email?: string;
  emailVerified?: boolean;
  email_verified?: boolean;
  roles?: string[];
  sessionId?: string;
  session_id?: string;
  exp?: number | string;
  expiresAt?: string;
  expires_at?: string;
  [key: string]: unknown;
}

export type ServerAuthIntrospector = (
  token: string,
  req: AuthenticatedRequest,
) => Promise<ServerAuthIntrospectionClaims> | ServerAuthIntrospectionClaims;

/**
 * Returns a middleware that verifies a JWT from the 'Authorization: Bearer <token>' header
 * and extracts it into req.jwt. Throws an error if invalid.
 */
export function jwtVerify(
  publicKey: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from a custom header and extracts it into req.jwt.
 * Throws an error if invalid.
 */
export function jwtVerifyWebToken(
  publicKey: string,
  headerName: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from the 'Authorization: Bearer <token>' header
 * and extracts it into req.jwt. Returns false instead of throwing if invalid.
 */
export function jwtVerifyNoThrow(
  publicKey: string,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from a custom header and extracts it into req.jwt.
 * Returns false instead of throwing if invalid.
 */
export function jwtVerifyWebTokenNoThrow(
  publicKey: string,
  headerName: string,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns middleware that verifies X-Authorization-Context and extracts it into req.userAuthorization.
 */
export function jwtVerifyUserAuthorization(
  publicKey: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationTokenOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns middleware that verifies X-Authorization-Context into req.userAuthorization without throwing for invalid tokens.
 */
export function jwtVerifyUserAuthorizationNoThrow(
  publicKey: string,
  options?: UserAuthorizationTokenOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a visitor token from the 'Visitor' header
 * and extracts it into req.visitor. Returns false instead of throwing if invalid.
 */
export function jwtVerifyVisitorNoThrow(
  publicKey: string,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns the sub from the extracted JWT in req.jwt.
 */
export function jwtGetClientId(req?: JwtRequestContext): string | undefined;

/**
 * Returns the sub from the extracted visitor token in req.visitor.
 */
export function jwtGetVisitorClientId(req?: JwtRequestContext): string | undefined;

/**
 * Checks if the extracted JWT in req.jwt has expired.
 */
export function jwtIsExpired(req: JwtRequestContext, jwtValiditySeconds?: number): boolean;
export function jwtIsExpired(jwtValiditySeconds: number): boolean;
export function jwtIsExpired(): boolean;

/**
 * Returns the age of the extracted JWT in seconds.
 */
export function jwtGetAgeInSeconds(req?: JwtRequestContext): number;

/**
 * Returns a middleware that verifies the JWT and checks if the user has the required role.
 */
export function jwtVerifyAndHasRole(
  userRole: string,
  publicKey: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns middleware that accepts either an ms-auth JWT or an opaque server-auth token.
 * Server-auth tokens are validated by the supplied introspector on every request.
 */
export function jwtVerifyOrServerAuth(
  publicKey: string,
  serverAuthIntrospector: ServerAuthIntrospector,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns middleware that accepts either an ms-auth JWT or server-auth token and
 * then checks that the authenticated user has the required role.
 */
export function jwtVerifyOrServerAuthAndHasRole(
  userRole: string,
  publicKey: string,
  serverAuthIntrospector: ServerAuthIntrospector,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Gets the full name of a role from its code (e.g., 'ad' -> 'admin').
 */
export function jwtGetRoleName(roleCode: string): string;

/**
 * Gets the code of a role from its name (e.g., 'admin' -> 'ad').
 */
export function jwtGetRoleCode(roleName: string): string;

/**
 * Represents the context derived from the JWT request.
 */
export interface JwtContext {
  /** The user ID (sub) from the JWT. Always returned. */
  user_id: string | undefined;
  /** The role of the user. Only set to 'super_admin' when roles contains 'ad'. */
  role?: string;
  /** Decoded scoped authorization claims from X-Authorization-Context when verified and attached. */
  authorizationContext?: UserAuthorizationPayload;
  /** The verified scoped authorization object attached to the request. */
  userAuthorization?: UserAuthorizationRequestObject;
}

/**
 * Returns the context derived from the JWT in req.jwt.
 * Always returns user_id. If the roles array contains 'ad', also returns role: 'super_admin'.
 * If req.userAuthorization is present, also returns authorizationContext and userAuthorization.
 */
export function jwtGetContext(req: JwtRequestContext): JwtContext;

/**
 * Validates the JWT from the Authorization header and extracts it into req.jwt.
 */
export function jwtValidateAndExtract(
  req: AuthenticatedRequest,
  publicKey: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): void;

/**
 * Validates X-Authorization-Context and extracts it into req.userAuthorization.
 */
export function jwtValidateAndExtractUserAuthorization(
  req: AuthenticatedRequest,
  publicKey: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationTokenOptions,
): void;

/**
 * Validates X-Authorization-Context and extracts it into req.userAuthorization (no-throw).
 */
export function jwtValidateAndExtractUserAuthorizationNoThrow(
  req: AuthenticatedRequest,
  publicKey: string,
  options?: UserAuthorizationTokenOptions,
): void;

/**
 * Validates a service-to-service JWT from the Authorization header and extracts it into req.jwt.
 */
export function jwtValidateAndExtractService(
  req: AuthenticatedRequest,
  publicKey: string,
  expectedIssuer: string,
  expectedAudience: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): void;

/**
 * Validates the Authorization header as either an ms-auth JWT or an opaque
 * server-auth token and extracts the result into req.jwt.
 */
export function jwtValidateAndExtractOrServerAuth(
  req: AuthenticatedRequest,
  publicKey: string,
  serverAuthIntrospector: ServerAuthIntrospector,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): Promise<void>;

/**
 * Validates the JWT from a custom header and extracts it into req.jwt.
 */
export function jwtValidateAndExtractWebToken(
  req: AuthenticatedRequest,
  publicKey: string,
  headerName: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): void;

/**
 * Validates the JWT from the Authorization header and extracts it into req.jwt (no-throw).
 */
export function jwtValidateAndExtractNoThrow(
  req: AuthenticatedRequest,
  publicKey: string,
  options?: UserAuthorizationReadOptions,
): void;

/**
 * Validates the JWT from a custom header and extracts it into req.jwt (no-throw).
 */
export function jwtValidateAndExtractWebTokenNoThrow(
  req: AuthenticatedRequest,
  publicKey: string,
  headerName: string,
  options?: UserAuthorizationReadOptions,
): void;

/**
 * Validates the visitor token from the 'Visitor' header and extracts it into req.visitor (no-throw).
 */
export function jwtValidateAndExtractVisitorNoThrow(
  req: AuthenticatedRequest,
  publicKey: string,
  options?: UserAuthorizationReadOptions,
): void;

/**
 * Returns middleware that verifies a service-to-service JWT from one expected sender.
 */
export function jwtVerifyService(
  publicKey: string,
  expectedIssuer: string,
  expectedAudience: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from the 'Authorization: Bearer <token>' header
 * and extracts it into req.jwt. Throws an error if invalid.
 * @deprecated use jwtVerify
 */
export function verifyJwt(
  publicKey: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from a custom header and extracts it into req.jwt.
 * Throws an error if invalid.
 * @deprecated use jwtVerifyWebToken
 */
export function verifyWebToken(
  publicKey: string,
  headerName: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from the 'Authorization: Bearer <token>' header
 * and extracts it into req.jwt. Returns false instead of throwing if invalid.
 * @deprecated use jwtVerifyNoThrow
 */
export function verifyJwtNoThrow(
  publicKey: string,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from a custom header and extracts it into req.jwt.
 * Returns false instead of throwing if invalid.
 * @deprecated use jwtVerifyWebTokenNoThrow
 */
export function verifyWebTokenNoThrow(
  publicKey: string,
  headerName: string,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a visitor token from the 'Visitor' header
 * and extracts it into req.visitor. Returns false instead of throwing if invalid.
 * @deprecated use jwtVerifyVisitorNoThrow
 */
export function verifyVisitorNoThrow(
  publicKey: string,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns the sub from the extracted JWT in req.jwt.
 * @deprecated use jwtGetClientId
 */
export function jwtClientId(req?: JwtRequestContext): string | undefined;

/**
 * Returns the sub from the extracted visitor token in req.visitor.
 * @deprecated use jwtGetVisitorClientId
 */
export function visitorClientId(req?: JwtRequestContext): string | undefined;

/**
 * Checks if the extracted JWT in req.jwt has expired.
 * @deprecated use jwtIsExpired
 */
export function isJwtExpired(req: JwtRequestContext, jwtValiditySeconds?: number): boolean;
/** @deprecated use jwtIsExpired */
export function isJwtExpired(jwtValiditySeconds: number): boolean;
/** @deprecated use jwtIsExpired */
export function isJwtExpired(): boolean;

/**
 * Returns the age of the extracted JWT in seconds.
 * @deprecated use jwtGetAgeInSeconds
 */
export function jwtAgeInSeconds(req?: JwtRequestContext): number;

/**
 * Returns a middleware that verifies the JWT and checks if the user has the required role.
 * @deprecated use jwtVerifyAndHasRole
 */
export function verifyJwtAndRole(
  userRole: string,
  publicKey: string,
  customErrorFunction?: () => void,
  options?: UserAuthorizationReadOptions,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Throws a Used_Token error.
 * @deprecated use jwtThrowUsedTokenError
 */
export function throwUsedTokenError(): never;

/**
 * Checks if the user in the extracted JWT has the specified role.
 * @deprecated use jwtDoesJwtUserHasRole
 */
export function doesJwtUserHasRole(req: JwtRequestContext, userRole: string): boolean;
/** @deprecated use jwtDoesJwtUserHasRole */
export function doesJwtUserHasRole(userRole: string): boolean;

/**
 * Gets the full name of a role from its code (e.g., 'ad' -> 'admin').
 * @deprecated use jwtGetRoleName
 */
export function getNameOfRole(roleCode: string): string;

/**
 * Gets the code of a role from its name (e.g., 'admin' -> 'ad').
 * @deprecated use jwtGetRoleCode
 */
export function getCodeOfRole(roleName: string): string;
