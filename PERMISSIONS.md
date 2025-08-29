# Permission System Documentation

## Overview

This project implements a comprehensive role-based access control (RBAC) system with fine-grained permissions. The system supports both role-based permissions and custom user-specific permissions.

## Architecture

### Backend Components

1. **Permission Models** (`models/permission.ts`)
   - `Permission`: Defines system permissions with categories
   - `UserPermission`: Links users to specific permissions with allow/deny flags

2. **Access Control** (`utils/access.ts`)
   - Permission checking functions
   - Role-based access control
   - Resource-specific permission checks

3. **API Routes** (`routes/permissionRoutes.ts`)
   - RESTful endpoints for permission management
   - User permission CRUD operations
   - Bulk permission updates

4. **Values** (`utils/values.ts`)
   - Role definitions
   - Permission definitions
   - Role-permission mappings

### Frontend Components

1. **Permission Context** (`contexts/permission-context.tsx`)
   - React context for permission state
   - Permission checking hooks
   - HOC for conditional rendering

2. **Permission API Hook** (`hooks/use-permissions-api.tsx`)
   - API interaction for permission management
   - CRUD operations for user permissions

3. **Permission Settings Component** (`components/PermissionSettings/`)
   - Admin interface for managing permissions
   - User permission assignment
   - Role overview

4. **Protected Routes** (`components/protected-route.tsx`)
   - Route-level permission checking
   - Automatic redirects for unauthorized access

## User Roles

### Admin
- Full system access
- User management
- Permission management
- System settings

### Lead Mentor
- User read/update access
- Project creation and management
- Milestone management
- Activity log access

### Project Mentor
- User read access
- Project read/update access
- Milestone management
- Activity log access

### External Partner
- Project read access
- Milestone read access
- Activity log read access

### Student
- Project read access
- Milestone read access

## Permission Categories

### User Management
- `users:create` - Create new users
- `users:read` - View user information
- `users:update` - Update user details
- `users:delete` - Delete users
- `users:manage_roles` - Assign roles and permissions

### Project Management
- `projects:create` - Create new projects
- `projects:read` - View project information
- `projects:update` - Update project details
- `projects:delete` - Delete projects
- `projects:assign_members` - Manage project membership

### Milestones
- `milestones:create` - Create milestones
- `milestones:read` - View milestones
- `milestones:update` - Update milestones
- `milestones:delete` - Delete milestones

### Activity Logs
- `activity_logs:read` - View activity logs
- `activity_logs:manage` - Manage activity logs

### System Administration
- `system:admin` - System administration access
- `system:settings` - System settings management

## API Endpoints

### GET `/api/permissions`
Get all available permissions and role mappings.

**Response:**
```json
{
  "permissions": [...],
  "availablePermissions": [...],
  "rolePermissions": {...}
}
```

### GET `/api/users/:userId/permissions`
Get permissions for a specific user.

**Response:**
```json
{
  "user": {...},
  "rolePermissions": [...],
  "effectivePermissions": [...]
}
```

### POST `/api/users/:userId/permissions`
Grant a permission to a user.

**Request:**
```json
{
  "permission": "users:read",
  "granted": "allow"
}
```

### DELETE `/api/users/:userId/permissions/:permissionId`
Revoke a permission from a user.

### PUT `/api/users/:userId/permissions/bulk`
Bulk update user permissions.

**Request:**
```json
{
  "permissions": [
    {"permission": "users:read", "granted": "allow"},
    {"permission": "users:write", "granted": "deny"}
  ]
}
```

## Frontend Usage

### Using Permission Context

```tsx
import { usePermissions, WithPermission } from '@/contexts/permission-context';

function MyComponent() {
  const { hasPermission, userRole } = usePermissions();
  
  if (hasPermission('users:create')) {
    // Show create user button
  }
  
  return (
    <WithPermission permission="users:read">
      <UserList />
    </WithPermission>
  );
}
```

### Protected Routes

```tsx
import ProtectedRoute from '@/components/protected-route';

<ProtectedRoute 
  requiredPermission="users:manage_roles"
  fallbackPath="/dashboard"
>
  <UserManagement />
</ProtectedRoute>
```

### Permission API

```tsx
import { usePermissionsApi } from '@/hooks/use-permissions-api';

function PermissionManager() {
  const { grantPermission, getUserPermissions } = usePermissionsApi();
  
  const handleGrantPermission = async (userId: string) => {
    await grantPermission(userId, 'users:read', 'allow');
  };
}
```

## Database Migration

The permission system requires database migrations to create the new tables:

1. `Permission` table
2. `UserPermission` table
3. Updates to `User` table for relationships

## Security Considerations

1. **Permission Inheritance**: Users inherit permissions from their roles
2. **Explicit Deny**: Custom permissions can explicitly deny role-based permissions
3. **Session Data**: User permissions are included in session data for performance
4. **API Security**: All endpoints require authentication and appropriate permissions

## Testing

### Backend Tests
- Unit tests for permission checking functions
- Integration tests for API endpoints
- Role-based access control tests

### Frontend Tests
- Component tests with permission context
- Route protection tests
- Permission hook tests

## Deployment Notes

1. Run database migrations before deploying
2. Seed initial permissions and roles
3. Update environment variables if needed
4. Test permission system in staging environment

## Future Enhancements

1. **Permission Groups**: Group related permissions together
2. **Conditional Permissions**: Time-based or context-based permissions
3. **Audit Logging**: Track permission changes
4. **Permission Templates**: Pre-defined permission sets for common roles
5. **Resource-Level Permissions**: Permissions tied to specific resources (projects, etc.)
