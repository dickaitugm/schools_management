# User & Role Management Implementation

## Overview
Implementasi sistem User & Role Management yang menggabungkan manajemen user dan role dalam satu halaman sidebar dengan dua kolom:
- **Kolom 1**: CRUD User yang berelasi dengan roles
- **Kolom 2**: Penetapan roles baru dengan akses eksisting

## Database Structure

### Tables
1. **users** - Tabel untuk menyimpan data user
   - `id` (Primary Key)
   - `username` (Unique)
   - `email` (Unique)
   - `password_hash`
   - `name`
   - `role_id` (Foreign Key ke roles.id)
   - `is_active`
   - `last_login`
   - `created_at`, `updated_at`

2. **roles** - Tabel untuk menyimpan data role
   - `id` (Primary Key)
   - `name` (Unique)
   - `description`
   - `permissions` (JSONB array)
   - `created_at`, `updated_at`

3. **permissions** - Tabel untuk menyimpan data permission
   - `id` (Primary Key)
   - `name` (Unique)
   - `description`
   - `category`
   - `created_at`

4. **role_permissions** - Tabel relasi many-to-many
   - `id` (Primary Key)
   - `role_id` (Foreign Key ke roles.id)
   - `permission_id` (Foreign Key ke permissions.id)

### Relationships
- `users.role_id` → `roles.id` (Many-to-One)
- `role_permissions.role_id` → `roles.id` (Many-to-One)
- `role_permissions.permission_id` → `permissions.id` (Many-to-One)

## API Endpoints

### Users API
- `GET /api/users` - Fetch all users dengan role information
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Fetch single user
- `PUT /api/users/[id]` - Update user (dengan/tanpa password)
- `DELETE /api/users/[id]` - Delete user

### Roles API
- `GET /api/roles` - Fetch all roles
- `GET /api/roles?include_permissions=true` - Fetch roles dengan permission details
- `POST /api/roles` - Create new role
- `GET /api/roles/[id]` - Fetch single role
- `PUT /api/roles/[id]` - Update role
- `DELETE /api/roles/[id]` - Delete role (jika tidak digunakan user)

### Permissions API
- `GET /api/permissions` - Fetch all permissions
- `POST /api/permissions` - Create new permission

## Frontend Components

### RoleManagement Component
Located: `components/RoleManagement.js`

#### Features:
- **Two-column layout**:
  - Left: User Management (CRUD users)
  - Right: Role & Permission Management
- **User Management**:
  - Create, Read, Update, Delete users
  - Assign roles to users
  - Password hashing dengan bcryptjs
  - User status (active/inactive)
- **Role Management**:
  - Create, Read, Update, Delete roles
  - Assign multiple permissions to roles
  - Permission checkboxes with categories
  - Role descriptions

#### UI Elements:
- Modal forms untuk create/edit
- Tables dengan sorting
- Search/filter capabilities
- Responsive design
- Loading states
- Error handling

## Security Features

1. **Password Encryption**: bcryptjs dengan salt rounds 10
2. **Input Validation**: Server-side validation untuk semua fields
3. **Unique Constraints**: Username dan email harus unique
4. **Foreign Key Constraints**: Data integrity dengan foreign keys
5. **Permission Checks**: Access control berdasarkan permissions
6. **Safe Deletion**: Tidak bisa delete role yang sedang digunakan

## Usage Flow

1. **Admin Login**: Menggunakan existing login system
2. **Navigate**: Ke menu "User & Role Management" di sidebar
3. **User Management**:
   - Klik "Tambah User" untuk create user baru
   - Pilih role dari dropdown (populated dari roles table)
   - Edit/delete existing users
4. **Role Management**:
   - Klik "Tambah Role" untuk create role baru
   - Select permissions dengan checkbox
   - Edit/delete existing roles

## Permission Categories
Current categories in database:
- `students` (4 permissions)
- `teachers` (4 permissions)
- `schools` (4 permissions)
- `lessons` (4 permissions)
- `schedules` (4 permissions)
- `cash_flow` (4 permissions)
- `assessments` (4 permissions)
- `reports` (1 permission)
- `system` (2 permissions)

## Default Data
- **1 User**: Administrator (admin/admin@bbforsociety.com)
- **8 Roles**: admin, teacher, staff, viewer, teachers, student, parents, guest
- **31 Permissions**: Distributed across 9 categories

## Navigation
- **Menu Path**: "User & Role Management" in sidebar
- **Permission Required**: `manage_roles`
- **Route**: `user-roles` (updated from `roles`)

## Files Created/Modified

### New API Files:
- `app/api/users/route.js`
- `app/api/users/[id]/route.js`
- `app/api/roles/route.js`
- `app/api/roles/[id]/route.js`
- `app/api/permissions/route.js`

### Modified Components:
- `components/RoleManagement.js` - Updated permission logic
- `components/Sidebar.js` - Updated menu item
- `components/App.js` - Updated route handling

### Test Scripts:
- `scripts/test-user-role-apis.js` - Database structure testing

## Dependencies
- `bcryptjs` - Password hashing (already in package.json)
- `pg` - PostgreSQL client
- `next` - API routes
- Database structure sesuai existing migration

## Ready for Production
✅ Database structure ready
✅ API endpoints implemented
✅ Frontend component updated
✅ Security features implemented
✅ Permission system integrated
✅ Responsive UI design
✅ Error handling implemented
