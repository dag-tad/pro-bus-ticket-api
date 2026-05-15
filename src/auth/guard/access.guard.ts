// access.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACCESS_KEY, AccessRequirements } from 'src/decorators/access.decorator';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Get access requirements from the route handler or controller
    const requirements = this.reflector.get<AccessRequirements>(
      ACCESS_KEY,
      context.getHandler(),
    );

    // If no access requirements defined, deny access by default (secure by default)
    if (!requirements) {
      throw new ForbiddenException('No access requirements defined for this endpoint');
    }

    const { realms, roles, mode = 'AND' } = requirements;

    // Check if wildcards are used (allow all)
    const isRealmWildcard = realms?.includes('*') || !realms?.length;
    const isRoleWildcard = roles?.includes('*') || !roles?.length;

    // If both are wildcards, allow access without further checks
    if (isRealmWildcard && isRoleWildcard) {
      return true;
    }

    // Check if user exists
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    let realmValid = true;
    let roleValid = true;

    // Check realms requirement (if not wildcard)
    if (realms && realms.length > 0 && !isRealmWildcard) {
      realmValid = user.realm && realms.includes(user.realm);
    }

    // Check roles requirement (if not wildcard)
    if (roles && roles.length > 0 && !isRoleWildcard) {
      roleValid = user.role && roles.includes(user.role);
    }

    let hasAccess: boolean;
    let requiredMessage: string;

    if (mode === 'AND') {
      hasAccess = realmValid && roleValid;
      requiredMessage = `realm in [${realms?.join(', ')}] AND role in [${roles?.join(', ')}]`;
    } else { // OR mode
      hasAccess = realmValid || roleValid;
      requiredMessage = `realm in [${realms?.join(', ')}] OR role in [${roles?.join(', ')}]`;
    }

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access denied: Required ${requiredMessage}. ` +
        `User has realm="${user.realm || 'undefined'}", role="${user.role || 'undefined'}"`
      );
    }

    return hasAccess;
  }
}