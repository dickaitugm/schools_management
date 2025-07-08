# Panduan Menggunakan User Management

## Cara Menambahkan User Baru

### Langkah-langkah:

1. **Navigasi ke User & Role Management**
   - Buka aplikasi di browser (http://localhost:3000)
   - Login sebagai admin
   - Klik menu "User & Role Management" di sidebar kiri

2. **Tambah User Baru**
   - Di kolom kiri (User Management), klik tombol **"Tambah User Baru"** berwarna biru
   - Modal form akan terbuka

3. **Isi Form User**
   - **Username**: Username unik untuk login (contoh: john_doe)
   - **Email**: Email address yang valid (contoh: john@example.com)
   - **Nama Lengkap**: Nama lengkap user (contoh: John Doe)
   - **Password**: Password untuk login (minimal 6 karakter)
   - **Role**: Pilih role dari dropdown (admin, teacher, staff, dll)
   - **User Active**: Centang jika user aktif

4. **Simpan User**
   - Klik tombol "Create" untuk menyimpan
   - User baru akan muncul di tabel users

## Fitur User Management Tersedia:

### ✅ Create User
- Form modal dengan validasi
- Password otomatis di-hash dengan bcrypt
- Assign role ke user

### ✅ Read Users
- Tabel menampilkan semua users
- Informasi: nama, username, email, role, status
- Debug info menampilkan jumlah users dan roles

### ✅ Update User
- Klik tombol "Edit" pada user yang ingin diubah
- Form pre-filled dengan data existing
- Password optional saat update (kosongkan jika tidak ingin mengubah)

### ✅ Delete User
- Klik tombol "Delete" pada user yang ingin dihapus
- Konfirmasi dialog sebelum delete
- User akan dihapus dari database

## Troubleshooting:

### Jika tombol "Tambah User" tidak muncul:
1. Pastikan Anda login sebagai user dengan permission `manage_roles`
2. Pastikan aplikasi berjalan di http://localhost:3000
3. Check console browser untuk error

### Jika dropdown Role kosong:
1. Pastikan ada roles di database
2. Tambahkan roles terlebih dahulu di kolom kanan (Role Management)

### Jika API error:
1. Pastikan database PostgreSQL berjalan
2. Check file .env.local untuk konfigurasi database
3. Jalankan: `npm run db:test` untuk test koneksi database

## Data Default:
- **1 User**: Administrator (admin/admin@bbforsociety.com)
- **8 Roles**: admin, teacher, staff, viewer, dll
- Password default admin: (sesuai seed data)

## Struktur Database:
- Table: `users`
- Foreign Key: `role_id` → `roles.id`
- Password: Encrypted dengan bcryptjs (10 salt rounds)

## API Endpoints:
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

---

**Status**: ✅ Semua fitur CRUD User sudah siap dan teruji
**Database**: ✅ Terkoneksi dan berfungsi normal
**Security**: ✅ Password encryption dan validation aktif
