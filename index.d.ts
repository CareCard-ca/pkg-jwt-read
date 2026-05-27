/**
 * Utility functions for authentication and authorization in the CareCard ecosystem.
 */

import { NextFunction, Request, Response } from 'express';

/**
 * Represents the standard JWT header structure.
 */
export interface JwtHeader {
  /** The cryptographic algorithm used to secure the JWT. */
  alg?: string;
  /** The media type of the JWT. Defaults to 'JWT'. */
  typ?: string;
  /** Any other custom header fields. */
  [key: string]: any;
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
  /** Any other custom payload fields. */
  [key: string]: any;
}

/**
 * Claims used by service-to-service JWTs.
 */
export interface ServiceJwtPayload extends JwtPayload {
  /** Issuing microservice name, for example 'ms-institutions'. */
  iss: string;
  /** Receiving microservice name or names. */
  aud: string | string[];
  /** Subject. Defaults to the issuing microservice name. */
  sub: string;
}

/**
 * Options for creating a service-to-service JWT.
 */
export interface ServiceJwtOptions {
  /** Issuing microservice name, for example 'ms-institutions'. */
  issuer: string;
  /** Receiving microservice name or names. */
  audience: string | string[];
  /** Private key owned by the issuing microservice. */
  privateKey: string;
  /** Subject claim. Defaults to issuer. */
  subject?: string;
  /** Issued-at timestamp in seconds or milliseconds. Defaults to now. */
  issuedAt?: number;
  /** Token lifetime in seconds. Defaults to 60. */
  expiresInSeconds?: number;
  /** JWT signing algorithm. Defaults to EdDSA. */
  algorithm?: string;
  /** Additional non-sensitive JWT claims. */
  claims?: Record<string, unknown>;
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
  jwtClientId: (req?: any) => string | undefined;
  doesJwtUserHasRole: (role: string) => boolean;
  isJwtExpired: (jwtValiditySeconds?: number) => boolean;
  jwtAgeInSeconds: (req?: any) => number;
}

/**
 * Structure of the visitor object attached to the request.
 */
export interface VisitorRequestObject {
  header: JwtHeader;
  payload: JwtPayload;
  visitorClientId: (req?: any) => string | undefined;
}

/**
 * Extended Express Request to include jwt and visitor objects.
 */
export interface AuthenticatedRequest extends Request {
  jwt?: JwtRequestObject | null;
  visitor?: VisitorRequestObject | null;
}

/**
 * Returns a middleware that verifies a JWT from the 'Authorization: Bearer <token>' header
 * and extracts it into req.jwt. Throws an error if invalid.
 */
export function jwtVerify(
  publicKey: string,
  customErrorFunction?: () => void,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from a custom header and extracts it into req.jwt.
 * Throws an error if invalid.
 */
export function jwtVerifyWebToken(
  publicKey: string,
  headerName: string,
  customErrorFunction?: () => void,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from the 'Authorization: Bearer <token>' header
 * and extracts it into req.jwt. Returns false instead of throwing if invalid.
 */
export function jwtVerifyNoThrow(publicKey: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from a custom header and extracts it into req.jwt.
 * Returns false instead of throwing if invalid.
 */
export function jwtVerifyWebTokenNoThrow(
  publicKey: string,
  headerName: string,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a visitor token from the 'Visitor' header
 * and extracts it into req.visitor. Returns false instead of throwing if invalid.
 */
export function jwtVerifyVisitorNoThrow(publicKey: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns the sub from the extracted JWT in req.jwt.
 */
export function jwtGetClientId(req?: any): string | undefined;

/**
 * Returns the sub from the extracted visitor token in req.visitor.
 */
export function jwtGetVisitorClientId(req?: any): string | undefined;

/**
 * Checks if the extracted JWT in req.jwt has expired.
 */
export function jwtIsExpired(req: any, jwtValiditySeconds?: number): boolean;
export function jwtIsExpired(jwtValiditySeconds: number): boolean;
export function jwtIsExpired(): boolean;

/**
 * Returns the age of the extracted JWT in seconds.
 */
export function jwtGetAgeInSeconds(req?: any): number;

/**
 * Returns a middleware that verifies the JWT and checks if the user has the required role.
 */
export function jwtVerifyAndHasRole(
  userRole: string,
  publicKey: string,
  customErrorFunction?: () => void,
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
}

/**
 * Returns the context derived from the JWT in req.jwt.
 * Always returns user_id. If the roles array contains 'ad', also returns role: 'super_admin'.
 */
export function jwtGetContext(req: any): JwtContext;

/**
 * Validates the JWT from the Authorization header and extracts it into req.jwt.
 */
export function jwtValidateAndExtract(req: AuthenticatedRequest, publicKey: string, customErrorFunction?: () => void): void;

/**
 * Validates a service-to-service JWT from the Authorization header and extracts it into req.jwt.
 */
export function jwtValidateAndExtractService(
  req: AuthenticatedRequest,
  publicKey: string,
  expectedIssuer: string,
  expectedAudience: string,
  customErrorFunction?: () => void,
): void;

/**
 * Validates the JWT from a custom header and extracts it into req.jwt.
 */
export function jwtValidateAndExtractWebToken(
  req: AuthenticatedRequest,
  publicKey: string,
  headerName: string,
  customErrorFunction?: () => void,
): void;

/**
 * Validates the JWT from the Authorization header and extracts it into req.jwt (no-throw).
 */
export function jwtValidateAndExtractNoThrow(req: AuthenticatedRequest, publicKey: string): void;

/**
 * Validates the JWT from a custom header and extracts it into req.jwt (no-throw).
 */
export function jwtValidateAndExtractWebTokenNoThrow(req: AuthenticatedRequest, publicKey: string, headerName: string): void;

/**
 * Validates the visitor token from the 'Visitor' header and extracts it into req.visitor (no-throw).
 */
export function jwtValidateAndExtractVisitorNoThrow(req: AuthenticatedRequest, publicKey: string): void;

/**
 * Creates a signed service-to-service JWT using the issuing service's private key.
 */
export function jwtCreateServiceToken(options: ServiceJwtOptions): string | null;

/**
 * Creates a Bearer Authorization header containing a signed service-to-service JWT.
 */
export function jwtCreateServiceAuthorizationHeader(options: ServiceJwtOptions): string | null;

/**
 * Returns middleware that verifies a service-to-service JWT from one expected sender.
 */
export function jwtVerifyService(
  publicKey: string,
  expectedIssuer: string,
  expectedAudience: string,
  customErrorFunction?: () => void,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from the 'Authorization: Bearer <token>' header
 * and extracts it into req.jwt. Throws an error if invalid.
 * @deprecated use jwtVerify
 */
export function verifyJwt(
  publicKey: string,
  customErrorFunction?: () => void,
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
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from the 'Authorization: Bearer <token>' header
 * and extracts it into req.jwt. Returns false instead of throwing if invalid.
 * @deprecated use jwtVerifyNoThrow
 */
export function verifyJwtNoThrow(publicKey: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from a custom header and extracts it into req.jwt.
 * Returns false instead of throwing if invalid.
 * @deprecated use jwtVerifyWebTokenNoThrow
 */
export function verifyWebTokenNoThrow(
  publicKey: string,
  headerName: string,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a visitor token from the 'Visitor' header
 * and extracts it into req.visitor. Returns false instead of throwing if invalid.
 * @deprecated use jwtVerifyVisitorNoThrow
 */
export function verifyVisitorNoThrow(publicKey: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns the sub from the extracted JWT in req.jwt.
 * @deprecated use jwtGetClientId
 */
export function jwtClientId(req?: any): string | undefined;

/**
 * Returns the sub from the extracted visitor token in req.visitor.
 * @deprecated use jwtGetVisitorClientId
 */
export function visitorClientId(req?: any): string | undefined;

/**
 * Checks if the extracted JWT in req.jwt has expired.
 * @deprecated use jwtIsExpired
 */
export function isJwtExpired(req: any, jwtValiditySeconds?: number): boolean;
/** @deprecated use jwtIsExpired */
export function isJwtExpired(jwtValiditySeconds: number): boolean;
/** @deprecated use jwtIsExpired */
export function isJwtExpired(): boolean;

/**
 * Returns the age of the extracted JWT in seconds.
 * @deprecated use jwtGetAgeInSeconds
 */
export function jwtAgeInSeconds(req?: any): number;

/**
 * Returns a middleware that verifies the JWT and checks if the user has the required role.
 * @deprecated use jwtVerifyAndHasRole
 */
export function verifyJwtAndRole(
  userRole: string,
  publicKey: string,
  customErrorFunction?: () => void,
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
export function doesJwtUserHasRole(req: any, userRole: string): boolean;
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
