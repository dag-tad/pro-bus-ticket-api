// access.decorator.ts
import { SetMetadata } from '@nestjs/common';

export interface AccessRequirements {
  realms?: string[];
  roles?: string[];
  mode?: 'AND' | 'OR';
}

export const ACCESS_KEY = 'access_requirements';

/**
 * Require specific realms and/or roles for access
 * @param realms - Array of allowed realms. Use ['*'] to allow any realm
 * @param roles - Array of allowed roles. Use ['*'] to allow any role
 * @param mode - 'AND' (default) requires both conditions, 'OR' requires at least one
 * 
 * @examples
 * // Allow any authenticated user (any realm, any role)
 * @RequireAccess(['*'], ['*'])
 * 
 * // Require specific realm, any role
 * @RequireAccess(['admin'], ['*'])
 * 
 * // Require specific role, any realm
 * @RequireAccess(['*'], ['manager'])
 * 
 * // Require specific realm AND specific role
 * @RequireAccess(['admin'], ['manager'])
 * 
 * // Require either specific realm OR specific role
 * @RequireAccess(['admin'], ['manager'], 'OR')
 * 
 * // Multiple options for realm and role
 * @RequireAccess(['admin', 'super-admin'], ['manager', 'supervisor'])
 */
export const RequireAccess = (
  realms: string[] = ['*'], 
  roles: string[] = ['*'], 
  mode: 'AND' | 'OR' = 'AND'
) => {
  // Clean up: remove duplicates and ensure '*' is properly handled
  const uniqueRealms = [...new Set(realms)];
  const uniqueRoles = [...new Set(roles)];
  
  return SetMetadata(ACCESS_KEY, { 
    realms: uniqueRealms, 
    roles: uniqueRoles, 
    mode 
  });
};