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
    delete_analytics_specific: false, // Can be made optional with additional logic
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
  if (!role) return false;
  
  return PERMISSION_MATRIX[role]?.[permission] || false;
};

/**
 * Check if user can perform an action based on their user role
 */
export const canPerformAction = (
  userRole: UserRole | null,
  permission: Permission,
  additionalContext?: {
    isQuizOwner?: boolean;
    isAdminOptionalDelete?: boolean; // For admin optional delete specific record
  }
): boolean => {
  if (!userRole) return false;

  // Special case for admin optional delete specific record
  if (permission === 'delete_analytics_specific' && userRole.role === 'ADMIN') {
    return additionalContext?.isAdminOptionalDelete || false;
  }

  // Special case for member limited update quiz
  if (permission === 'update_quiz' && userRole.role === 'MEMBER') {
    return additionalContext?.isQuizOwner || false;
  }

  return hasPermission(userRole.role, permission);
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
