/**
 * Utility functions for reading and verifying JWTs.
 */

/**
 * Verifies a JWT from the 'Authorization: Bearer <token>' header and extracts it into req.jwt.
 * Throws an error if invalid.
 */
export function verifyJwt(req: any, publicKey: string, customErrorFunction?: () => void): Promise<any>;

/**
 * Verifies a JWT from a custom header and extracts it into req.jwt.
 * Throws an error if invalid.
 */
export function verifyWebToken(req: any, publicKey: string, headerName: string, customErrorFunction?: () => void): Promise<any>;

/**
 * Verifies a JWT from the 'Authorization: Bearer <token>' header and extracts it into req.jwt.
 * Returns false instead of throwing if invalid.
 */
export function verifyJwtNoThrow(req: any, publicKey: string): Promise<boolean>;

/**
 * Verifies a JWT from a custom header and extracts it into req.jwt.
 * Returns false instead of throwing if invalid.
 */
export function verifyWebTokenNoThrow(req: any, publicKey: string, headerName: string): Promise<boolean>;

/**
 * Verifies a visitor token from the 'x-visitor-token' header and extracts it into req.visitor.
 * Returns false instead of throwing if invalid.
 */
export function verifyVisitorNoThrow(req: any, publicKey: string): Promise<boolean>;

/**
 * Returns the client_id from the extracted JWT in req.jwt.
 */
export function jwtClientId(req: any): string | undefined;

/**
 * Returns the client_id from the extracted visitor token in req.visitor.
 */
export function visitorClientId(req: any): string | undefined;

/**
 * Checks if the extracted JWT in req.jwt has expired.
 */
export function isJwtExpired(req: any, jwtValiditySeconds?: number): boolean;

/**
 * Returns the age of the extracted JWT in seconds.
 */
export function jwtAgeInSeconds(req: any): number;

/**
 * Verifies the JWT and checks if the user has the required role.
 */
export function verifyJwtAndRole(req: any, publicKey: string, userRole: string, customErrorFunction?: () => void): Promise<any>;

/**
 * Throws a Used_Token error.
 */
export function throwUsedTokenError(): never;

/**
 * Checks if the user in the extracted JWT has the specified role.
 */
export function doesJwtUserHasRole(req: any, userRole: string): boolean;

/**
 * Gets the full name of a role from its code (e.g., 'ad' -> 'admin').
 */
export function getNameOfRole(roleCode: string): string;

/**
 * Gets the code of a role from its name (e.g., 'admin' -> 'ad').
 */
export function getCodeOfRole(roleName: string): string;
