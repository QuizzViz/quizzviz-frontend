import { UserRole } from '@/hooks/useUserRole';

export type Permission = 
  | 'generate_quiz'
  | 'update_quiz'
  | 'publish_quiz'
  | 'delete_quiz'
  | 'view_analytics'
  | 'delete_analytics_all'
  | 'delete_analytics_specific'
  | 'invite_members'
  | 'manage_roles'
  | 'delete_company';

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';

interface PermissionMatrix {
  OWNER: {
    [K in Permission]: boolean;
  };
  ADMIN: {
    [K in Permission]: boolean;
  };
  MEMBER: {
    [K in Permission]: boolean;
  };
}

// Permission matrix based on the provided table
const PERMISSION_MATRIX: PermissionMatrix = {
  OWNER: {
    generate_quiz: true,
    update_quiz: true,
    publish_quiz: true,
    delete_quiz: true,
    view_analytics: true,
    delete_analytics_all: true,
    delete_analytics_specific: true,
    invite_members: true,
    manage_roles: true,
    delete_company: true,
  },
  ADMIN: {
    generate_quiz: true,
    update_quiz: true,
    publish_quiz: true,
    delete_quiz: true,
    view_analytics: true,
    delete_analytics_all: false,
    delete_analytics_specific: true, // Admin can delete specific records
    invite_members: true,
    manage_roles: false,
    delete_company: false,
  },
  MEMBER: {
    generate_quiz: true,
    update_quiz: true, // Limited (will need additional logic for limited access)
    publish_quiz: false,
    delete_quiz: false,
    view_analytics: true,
    delete_analytics_all: false,
    delete_analytics_specific: false,
    invite_members: false,
    manage_roles: false,
    delete_company: false,
  },
};

/**
 * Check if a user role has permission for a specific action
 */
export const hasPermission = (
  role: Role | null | undefined,
  permission: Permission
): boolean => {
  console.log('hasPermission called:', {
    role: role,
    permission: permission,
    permissionMatrix: PERMISSION_MATRIX,
    rolePermissions: role ? PERMISSION_MATRIX[role] : 'no role'
  });
  
  if (!role) {
    console.log('hasPermission: no role, returning false');
    return false;
  }
  
  const result = PERMISSION_MATRIX[role]?.[permission] || false;
  console.log('hasPermission result:', {
    role: role,
    permission: permission,
    matrixValue: PERMISSION_MATRIX[role]?.[permission],
    finalResult: result
  });
  
  return result;
};

/**
 * Check if user can perform an action based on their user role
 */
export const canPerformAction = (
  userRole: UserRole | null,
  permission: Permission,
  additionalContext?: {
    isQuizOwner?: boolean;
  }
): boolean => {
  console.log('canPerformAction called:', {
    userRole: userRole,
    userRoleString: JSON.stringify(userRole),
    permission: permission,
    additionalContext: additionalContext
  });
  
  if (!userRole) {
    console.log('canPerformAction: no userRole, returning false');
    return false;
  }

  // Special case for member limited update quiz
  if (permission === 'update_quiz' && userRole.role === 'MEMBER') {
    return additionalContext?.isQuizOwner || false;
  }

  const result = hasPermission(userRole.role, permission);
  console.log('canPerformAction: hasPermission result:', {
    role: userRole.role,
    permission: permission,
    result: result
  });
  
  return result;
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: Role): Permission[] => {
  const permissions: Permission[] = [];
  
  Object.entries(PERMISSION_MATRIX[role]).forEach(([permission, hasAccess]) => {
    if (hasAccess) {
      permissions.push(permission as Permission);
    }
  });
  
  return permissions;
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (
  userRole: UserRole | null,
  permissions: Permission[],
  additionalContext?: {
    isQuizOwner?: boolean;
    isAdminOptionalDelete?: boolean;
  }
): boolean => {
  if (!userRole) return false;
  
  return permissions.some(permission => 
    canPerformAction(userRole, permission, additionalContext)
  );
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (
  userRole: UserRole | null,
  permissions: Permission[],
  additionalContext?: {
    isQuizOwner?: boolean;
    isAdminOptionalDelete?: boolean;
  }
): boolean => {
  if (!userRole) return false;
  
  return permissions.every(permission => 
    canPerformAction(userRole, permission, additionalContext)
  );
};

/**
 * Get user-friendly permission descriptions
 */
export const getPermissionDescription = (permission: Permission): string => {
  const descriptions: Record<Permission, string> = {
    generate_quiz: 'Generate Quiz',
    update_quiz: 'Update Quiz',
    publish_quiz: 'Publish / Unpublish Quiz',
    delete_quiz: 'Delete Quiz',
    view_analytics: 'View Analytics',
    delete_analytics_all: 'Delete All Analytics',
    delete_analytics_specific: 'Delete Specific Record',
    invite_members: 'Invite Members',
    manage_roles: 'Manage Roles',
    delete_company: 'Delete Company',
  };
  
  return descriptions[permission] || permission;
};

/**
 * Get role hierarchy level for comparison
 */
export const getRoleLevel = (role: Role): number => {
  const levels: Record<Role, number> = {
    OWNER: 3,
    ADMIN: 2,
    MEMBER: 1,
  };
  
  return levels[role] || 0;
};

/**
 * Check if one role can override another (higher hierarchy)
 */
export const canOverrideRole = (userRole: Role, targetRole: Role): boolean => {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
};

/**
 * Get user-friendly role display name
 */
export const getRoleDisplayName = (role: Role): string => {
  const displayNames: Record<Role, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MEMBER: 'Member',
  };
  
  return displayNames[role] || role;
};

/**
 * Get which roles can perform a specific action
 */
export const getRolesForAction = (permission: Permission): Role[] => {
  const roles: Role[] = [];
  
  Object.entries(PERMISSION_MATRIX).forEach(([role, permissions]) => {
    if (permissions[permission]) {
      roles.push(role as Role);
    }
  });
  
  return roles;
};

/**
 * Get user-friendly description of who can perform an action
 */
export const getActionAllowedRoles = (permission: Permission): string => {
  const allowedRoles = getRolesForAction(permission);
  
  if (allowedRoles.length === 3) {
    return 'All users';
  }
  
  if (allowedRoles.length === 2) {
    return `${getRoleDisplayName(allowedRoles[0])} and ${getRoleDisplayName(allowedRoles[1])}`;
  }
  
  if (allowedRoles.length === 1) {
    return `Only ${getRoleDisplayName(allowedRoles[0])}`;
  }
  
  return 'No one';
};
