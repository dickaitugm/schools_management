# Sistem Login & Role Management

## Fitur yang Ditambahkan

### 1. Komponen Login (Login.js)
- **Tampilan login sederhana** dengan username dan password
- **5 Demo Accounts** untuk testing:
  - **Admin**: admin / admin123 (akses penuh)
  - **Teacher**: teacher1 / teacher123 (akses terbatas)
  - **Student**: student1 / student123 (akses minimal)
  - **Parent**: parent1 / parent123 (akses orang tua)
  - **Guest**: guest1 / guest123 (akses tamu)
- **Error handling** dan loading state
- **Auto-fill demo credentials** dengan tombol cepat

### 2. Authentication Context (AuthContext.js)
- **Authentication state management** menggunakan React Context
- **Permission system** berdasarkan role
- **Local storage** untuk persist login session
- **HOC (Higher-Order Component)** untuk protecting routes
- **Role-based permissions**:
  - `admin`: All permissions (*)
  - `teachers`: read_students, read_teachers, read_schedules, read_lessons, view_reports, view_assessments, create_assessments
  - `student`: read_schedules, read_lessons, view_assessments
  - `parents`: read_students, read_schedules, view_assessments
  - `guest`: read_schedules, read_lessons

### 3. Role Management (RoleManagement.js)
- **CRUD operations** untuk roles dan permissions
- **24 predefined permissions** untuk semua fitur aplikasi
- **Permission assignment** per role dengan checkbox interface
- **Visual interface** untuk manajemen roles
- **Local storage** untuk menyimpan role configurations

### 4. Updated Sidebar (Sidebar.js)
- **Permission-based menu** - hanya menampilkan menu yang diizinkan
- **User information** display dengan nama dan role
- **Logout functionality**
- **New menu item**: Role Management (hanya untuk admin)

### 5. Updated App Structure (App.js)
- **Complete authentication flow** integration
- **Route protection** berdasarkan permissions
- **State management** untuk view navigation
- **Mobile-responsive** design

## Permissions List

### Students Management
- `create_students` - Membuat data siswa
- `read_students` - Melihat data siswa
- `update_students` - Mengubah data siswa
- `delete_students` - Menghapus data siswa

### Teachers Management
- `create_teachers` - Membuat data guru
- `read_teachers` - Melihat data guru
- `update_teachers` - Mengubah data guru
- `delete_teachers` - Menghapus data guru

### Schools Management
- `create_schools` - Membuat data sekolah
- `read_schools` - Melihat data sekolah
- `update_schools` - Mengubah data sekolah
- `delete_schools` - Menghapus data sekolah

### Schedules Management
- `create_schedules` - Membuat jadwal
- `read_schedules` - Melihat jadwal
- `update_schedules` - Mengubah jadwal
- `delete_schedules` - Menghapus jadwal

### Lessons Management
- `create_lessons` - Membuat pelajaran
- `read_lessons` - Melihat pelajaran
- `update_lessons` - Mengubah pelajaran
- `delete_lessons` - Menghapus pelajaran

### System Management
- `manage_roles` - Mengelola roles dan permissions
- `view_reports` - Melihat laporan
- `view_assessments` - Melihat penilaian
- `create_assessments` - Membuat penilaian

## Cara Penggunaan

### 1. Login
1. Buka aplikasi, akan muncul halaman login
2. Pilih salah satu demo account atau masukkan credentials manual
3. Klik tombol "Masuk"

### 2. Akses Menu Berdasarkan Role
- Menu yang tersedia akan disesuaikan dengan role user
- **Admin** melihat semua menu termasuk Role Management
- **Teacher** hanya melihat menu yang diizinkan (Students, Schedules, dll)
- **Student/Parent/Guest** melihat menu terbatas

### 3. Manajemen Roles (Admin only)
1. Login sebagai admin
2. Klik menu "Role Management" di sidebar
3. Tambah/edit/hapus roles
4. Assign permissions ke setiap role

### 4. Logout
- Klik tombol "Logout" di bagian bawah sidebar
- Session akan dihapus dan kembali ke halaman login

## Security Implementation

### Current (Mock/Demo)
- **Client-side storage** (localStorage)
- **Mock users** dan credentials
- **Permission checking** di frontend

### Production Ready (Recommendations)
- **Server-side authentication** dengan JWT tokens
- **Encrypted credentials** dan secure sessions
- **API-based permission** checking
- **Rate limiting** untuk login attempts
- **HTTPS** dan secure headers
- **Database-stored** users dan roles

## File Structure

```
components/
├── Login.js              # Login interface
├── AuthContext.js        # Authentication context & HOC
├── RoleManagement.js     # CRUD roles & permissions
├── Sidebar.js            # Updated with permissions
├── App.js               # Main app with auth integration
└── SchoolManagement.js   # Updated with permission checks

app/
└── page.js              # Simplified to use App component
```

## Next Steps

1. **Integrasi dengan Backend API** untuk real authentication
2. **Database schema** untuk users, roles, dan permissions
3. **Password hashing** dan security enhancements
4. **Audit logging** untuk user actions
5. **Permission validation** di level API
6. **Role hierarchies** dan inheritance
7. **Multi-tenancy** support untuk multiple schools

## Demo Usage

Untuk testing fitur login dan role management:

1. **Test Admin**: Gunakan admin/admin123 untuk akses penuh
2. **Test Teacher**: Gunakan teacher1/teacher123 untuk akses terbatas
3. **Test Student**: Gunakan student1/student123 untuk akses minimal
4. **Role Management**: Login sebagai admin, buka menu "Role Management"
5. **Permission Testing**: Login dengan role berbeda dan lihat perbedaan menu
