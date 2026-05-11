export const ADMIN_ROLES = ['admin', 'super_admin'];
export const STAFF_ROLES = [...ADMIN_ROLES, 'assistant'];

export const ROLE_PERMISSIONS = {
  assistant: [
    'pharmacies:read',
    'pharmacies:write:regional',
    'gardes:read',
    'gardes:write:regional',
    'uploads:pharmacies:regional',
    'uploads:gardes:regional',
    'regions:read',
  ],
  admin: ['*'],
  super_admin: ['*'],
};

const ASSISTANT_HIDDEN_PATHS = new Set(['/dashboard', '/upload-medicines']);

export const roleValue = (role) => (role || '').toLowerCase();

export const isAssistantRole = (role) => roleValue(role) === 'assistant';

export const canManageAssistants = (role) => ADMIN_ROLES.includes(roleValue(role));

export const getDefaultRouteForUser = (user) => (
  isAssistantRole(user?.role) ? '/management' : '/dashboard'
);

export const hasAllowedRole = (role, allowedRoles = []) => {
  if (!allowedRoles.length) return true;
  return allowedRoles.some((allowedRole) => roleValue(allowedRole) === roleValue(role));
};

export const canViewNavigationPath = (role, path) => {
  if (isAssistantRole(role)) {
    return !ASSISTANT_HIDDEN_PATHS.has(path);
  }
  return true;
};
