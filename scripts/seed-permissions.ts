/**
 * Permission Seeding Script
 * 
 * This script seeds the database with initial permissions and sets up
 * 
 * 
 *  Testing Script for Permission System
 */

import { PrismaClient } from '@prisma/client';
import { PermissionValues } from '../utils/values';

const prisma = new PrismaClient();

const PERMISSION_DEFINITIONS = [
  // User Management Permissions
  { name: 'users:create', description: 'Create new users', category: 'users' },
  { name: 'users:read', description: 'View user information', category: 'users' },
  { name: 'users:update', description: 'Update user details', category: 'users' },
  { name: 'users:delete', description: 'Delete users', category: 'users' },
  { name: 'users:manage_roles', description: 'Assign roles and permissions to users', category: 'users' },
  
  // Project Management Permissions
  { name: 'projects:create', description: 'Create new projects', category: 'projects' },
  { name: 'projects:read', description: 'View project information', category: 'projects' },
  { name: 'projects:update', description: 'Update project details', category: 'projects' },
  { name: 'projects:delete', description: 'Delete projects', category: 'projects' },
  { name: 'projects:assign_members', description: 'Manage project membership', category: 'projects' },
  
  // Milestone Permissions
  { name: 'milestones:create', description: 'Create milestones', category: 'milestones' },
  { name: 'milestones:read', description: 'View milestones', category: 'milestones' },
  { name: 'milestones:update', description: 'Update milestones', category: 'milestones' },
  { name: 'milestones:delete', description: 'Delete milestones', category: 'milestones' },
  
  // Activity Log Permissions
  { name: 'activity_logs:read', description: 'View activity logs', category: 'activity_logs' },
  { name: 'activity_logs:manage', description: 'Manage activity logs', category: 'activity_logs' },
  
  // System Administration
  { name: 'system:admin', description: 'System administration access', category: 'system' },
  { name: 'system:settings', description: 'System settings management', category: 'system' },
];

async function seedPermissions() {
  console.log('🌱 Seeding permissions...');

  try {
    // Create permissions
    for (const permission of PERMISSION_DEFINITIONS) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {
          description: permission.description,
          category: permission.category,
        },
        create: {
          name: permission.name,
          description: permission.description,
          category: permission.category,
        },
      });
    }

    console.log(`✅ Created/updated ${PERMISSION_DEFINITIONS.length} permissions`);

    // Create a super admin user if none exists
    const adminUser = await prisma.user.findFirst({
      where: { role: 'Admin' },
    });

    if (!adminUser) {
      console.log('⚠️  No admin user found. Please create an admin user manually or through the Keystone admin interface.');
    } else {
      console.log(`✅ Admin user exists: ${adminUser.email}`);
    }

    console.log('🎉 Permission seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedPermissions();
}

export { seedPermissions };