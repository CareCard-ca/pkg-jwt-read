/**
 * Utility functions for reading and verifying JWTs.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Basic structure of a JWT payload as used in this package.
 */
export interface JwtPayload {
    sub?: string;
    exp?: number;
    iat?: number;
    roles?: string[];
    [key: string]: any;
}

/**
 * Structure of the JWT object attached to the request.
 */
export interface JwtRequestObject {
    header: any;
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
    header: any;
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
export function verifyJwt(publicKey: string, customErrorFunction?: () => void): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from a custom header and extracts it into req.jwt.
 * Throws an error if invalid.
 */
export function verifyWebToken(publicKey: string, headerName: string, customErrorFunction?: () => void): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from the 'Authorization: Bearer <token>' header
 * and extracts it into req.jwt. Returns false instead of throwing if invalid.
 */
export function verifyJwtNoThrow(publicKey: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a JWT from a custom header and extracts it into req.jwt.
 * Returns false instead of throwing if invalid.
 */
export function verifyWebTokenNoThrow(publicKey: string, headerName: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns a middleware that verifies a visitor token from the 'Visitor' header
 * and extracts it into req.visitor. Returns false instead of throwing if invalid.
 */
export function verifyVisitorNoThrow(publicKey: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Returns the sub from the extracted JWT in req.jwt.
 */
export function jwtClientId(req?: any): string | undefined;

/**
 * Returns the sub from the extracted visitor token in req.visitor.
 */
export function visitorClientId(req?: any): string | undefined;

/**
 * Checks if the extracted JWT in req.jwt has expired.
 */
export function isJwtExpired(req?: any, jwtValiditySeconds?: number): boolean;

/**
 * Returns the age of the extracted JWT in seconds.
 */
export function jwtAgeInSeconds(req?: any): number;

/**
 * Returns a middleware that verifies the JWT and checks if the user has the required role.
 */
export function verifyJwtAndRole(userRole: string, publicKey: string, customErrorFunction?: () => void): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

/**
 * Throws a Used_Token error.
 */
export function throwUsedTokenError(): never;

/**
 * Checks if the user in the extracted JWT has the specified role.
 */
export function doesJwtUserHasRole(req: any, userRole: string): boolean;
export function doesJwtUserHasRole(userRole: string): boolean;

/**
 * Gets the full name of a role from its code (e.g., 'ad' -> 'admin').
 */
export function getNameOfRole(roleCode: string): string;

/**
 * Gets the code of a role from its name (e.g., 'admin' -> 'ad').
 */
export function getCodeOfRole(roleName: string): string;
