/** Role names (backend/domains/iam/models.py Role.Name) shown in the IAM UI. */
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

export const AUTH_PROVIDER_LABEL: Record<string, string> = {
  local: 'Local',
  entra_id: 'Microsoft Entra ID'
};

/** Permission resources (backend/domains/iam/models.py Permission.Resource). */
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

/** Permission actions (backend/domains/iam/models.py Permission.Action). */
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

/** IamAuditEvent.EventType labels + badge color, for the Overview and Audit Log pages. */
export const AUDIT_EVENT_LABEL: Record<string, string> = {
  'user.created': 'User created',
  'user.activated': 'User activated',
  'user.deactivated': 'User deactivated',
  'user.deleted': 'User deleted',
  'role.granted': 'Role granted',
  'role.revoked': 'Role revoked',
  'sso.sign_in': 'Sign-in',
  'login.failed': 'Sign-in failed'
};

export const AUDIT_EVENT_COLOR: Record<
  string,
  'green' | 'red' | 'blue' | 'gray' | 'amber'
> = {
  'user.created': 'green',
  'user.activated': 'green',
  'user.deactivated': 'red',
  'user.deleted': 'red',
  'role.granted': 'green',
  'role.revoked': 'red',
  'sso.sign_in': 'blue',
  'login.failed': 'amber'
};

export function auditEventLabel(eventType: string): string {
  return AUDIT_EVENT_LABEL[eventType] ?? eventType;
}

/** Access-review status derived from User.nextAccessReviewDate, for the Users grid. */
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
