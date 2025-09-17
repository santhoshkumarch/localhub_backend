const roles = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  VIEWER: 'viewer'
};

const permissions = {
  // Users
  'users:read': [roles.SUPERADMIN, roles.ADMIN, roles.VIEWER],
  'users:write': [roles.SUPERADMIN, roles.ADMIN],
  'users:delete': [roles.SUPERADMIN],
  
  // Businesses
  'businesses:read': [roles.SUPERADMIN, roles.ADMIN, roles.VIEWER],
  'businesses:write': [roles.SUPERADMIN, roles.ADMIN],
  'businesses:delete': [roles.SUPERADMIN],
  
  // Posts
  'posts:read': [roles.SUPERADMIN, roles.ADMIN, roles.VIEWER],
  'posts:write': [roles.SUPERADMIN, roles.ADMIN],
  'posts:delete': [roles.SUPERADMIN],
  
  // Hashtags
  'hashtags:read': [roles.SUPERADMIN, roles.ADMIN, roles.VIEWER],
  'hashtags:write': [roles.SUPERADMIN, roles.ADMIN],
  'hashtags:delete': [roles.SUPERADMIN],
  
  // Admin management
  'admins:read': [roles.SUPERADMIN],
  'admins:write': [roles.SUPERADMIN],
  'admins:delete': [roles.SUPERADMIN]
};

class Role {
  static hasPermission(userRole, permission) {
    return permissions[permission]?.includes(userRole) || false;
  }
  
  static getRoles() {
    return roles;
  }
}

module.exports = Role;