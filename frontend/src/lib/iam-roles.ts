export const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  ciso: 'CISO',
  risk_manager: 'Risk Manager',
  auditor: 'Auditor',
  control_owner: 'Control Owner',
  viewer: 'Viewer'
};

export function roleLabel(name: string): string {
  return ROLE_LABEL[name] ?? name;
}

export const ROLE_DESCRIPTION: Record<string, string> = {
  admin: 'Full identity administration — creates users, assigns roles',
  ciso: 'Owns the ISMS — approves risks, controls and obligations',
  risk_manager: 'Owns the risk register, assessments and incident records',
  auditor: 'Records and approves audit findings; read-only elsewhere',
  control_owner: 'Operates controls and raises incidents',
  viewer: 'Read-only access across risk, controls, audit and obligations'
};

export function roleDescription(name: string): string {
  return ROLE_DESCRIPTION[name] ?? '';
}

export const AUTH_PROVIDER_LABEL: Record<string, string> = {
  local: 'Local',
  entra_id: 'Microsoft Entra ID'
};

export const PERMISSION_RESOURCE_LABEL: Record<string, string> = {
  iam_users: 'Users',
  iam_roles: 'Roles',
  risk: 'Risk register',
  controls: 'Controls',
  audit: 'Audit findings',
  incidents: 'Incidents',
  obligations: 'Obligations'
};

export function permissionResourceLabel(resource: string): string {
  return PERMISSION_RESOURCE_LABEL[resource] ?? resource;
}

export const PERMISSION_ACTION_LABEL: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  assign: 'Assign'
};

export function permissionActionLabel(action: string): string {
  return PERMISSION_ACTION_LABEL[action] ?? action;
}

export function isPrivilegedGrant(permission: {
  resource: string;
  action: string;
}): boolean {
  return (
    (permission.resource === 'iam_users' ||
      permission.resource === 'iam_roles') &&
    permission.action !== 'view'
  );
}

export const AUDIT_EVENT_LABEL: Record<string, string> = {
  'user.created': 'User created',
  'user.updated': 'User updated',
  'user.activated': 'User activated',
  'user.deactivated': 'User deactivated',
  'user.deleted': 'User deleted',
  'role.granted': 'Role granted',
  'role.revoked': 'Role revoked',
  'permission.granted': 'Permission granted',
  'permission.revoked': 'Permission revoked',
  'mfa.enabled': 'MFA enabled',
  'mfa.disabled': 'MFA disabled',
  'mfa.reset': 'MFA reset by admin',
  'mfa.codes_regenerated': 'Recovery codes regenerated',
  'profile.updated': 'Profile updated',
  'sso.sign_in': 'Sign-in',
  'login.failed': 'Sign-in failed'
};

export const AUDIT_EVENT_COLOR: Record<
  string,
  'green' | 'red' | 'blue' | 'gray' | 'amber'
> = {
  'user.created': 'green',
  'user.updated': 'blue',
  'user.activated': 'green',
  'user.deactivated': 'red',
  'user.deleted': 'red',
  'role.granted': 'green',
  'role.revoked': 'red',
  'permission.granted': 'green',
  'permission.revoked': 'red',
  'mfa.enabled': 'green',
  'mfa.disabled': 'red',
  'mfa.reset': 'amber',
  'mfa.codes_regenerated': 'blue',
  'profile.updated': 'blue',
  'sso.sign_in': 'blue',
  'login.failed': 'amber'
};

export function auditEventLabel(eventType: string): string {
  return AUDIT_EVENT_LABEL[eventType] ?? eventType;
}

export function accessReviewStatus(nextReviewDate: string | null | undefined): {
  label: string;
  color: 'green' | 'red' | 'blue' | 'gray' | 'amber';
} {
  if (!nextReviewDate) return { label: 'Not scheduled', color: 'gray' };

  const dueInDays = Math.ceil(
    (new Date(nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (dueInDays < 0) return { label: 'Overdue', color: 'red' };
  if (dueInDays <= 30) return { label: 'Due soon', color: 'amber' };
  return { label: 'Scheduled', color: 'blue' };
}
