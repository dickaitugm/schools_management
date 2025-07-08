# 🎯 LOKASI CRUD USER - Panduan Visual

## 📍 Dimana Menemukan CRUD User?

### 1. **Login ke Aplikasi**
```
URL: http://localhost:3000
Login sebagai: admin
```

### 2. **Navigasi ke User Management**
```
Sidebar → "User & Role Management" 
(Icon: ⚙️ - memerlukan permission: manage_roles)
```

### 3. **Tampilan User & Role Management**

```
┌─────────────────────────────────────────────────────────────────┐
│                   User & Role Management                        │
├─────────────────────────────────────────────────────────────────┤
│  [Petunjuk: Kolom kiri untuk Users, kolom kanan untuk Roles]   │
├─────────────────────────────────┬───────────────────────────────┤
│          USER MANAGEMENT        │     ROLE MANAGEMENT           │
│   👥 Kelola users dan roles     │  🛡️ Kelola roles & permissions│
│                                 │                               │
│  [📋 Cara Mengelola Users:]     │                               │
│  • Tambah: Klik "Tambah User"   │   [Tambah Role Baru] 🟢      │
│  • Edit: Klik "Edit"            │                               │
│  • Hapus: Klik "Delete"         │   ┌─────────────────────┐     │
│                                 │   │  Tabel Roles        │     │
│   [Tambah User Baru] 🔵        │   └─────────────────────┘     │
│                                 │                               │
│   ┌─────────────────────────┐   │                               │
│   │     Tabel Users         │   │                               │
│   │ - Administrator         │   │                               │
│   │   admin • active        │   │                               │
│   │   [Edit] [Delete]       │   │                               │
│   └─────────────────────────┘   │                               │
└─────────────────────────────────┴───────────────────────────────┘
```

## 🔵 TOMBOL "TAMBAH USER BARU"

### Lokasi:
- **Kolom**: Kiri (User Management)
- **Posisi**: Kanan atas kolom user management
- **Warna**: Biru (#blue-600)
- **Icon**: ➕ Plus sign
- **Text**: "Tambah User Baru"

### Fungsi:
- Membuka modal form untuk create user baru
- Form fields: Username, Email, Password, Nama, Role, Status Active
- Validation: Semua field required, email format, unique username/email

## 📝 FORM CREATE USER

```
┌────────────────────────────────────────┐
│        👤 Tambah User Baru             │
├────────────────────────────────────────┤
│ Mode: Create | Roles tersedia: 8       │
├────────────────────────────────────────┤
│                                        │
│ Username: [___________________] *      │
│ Email:    [___________________] *      │
│ Password: [___________________] *      │
│ Nama:     [___________________] *      │
│ Role:     [Pilih Role ▼     ] *      │
│           ☑️ User Active               │
│                                        │
│           [Batal]  [✓ Buat User] 🔵   │
└────────────────────────────────────────┘
```

## 🚀 Quick Start Guide

### Untuk Menambah User:

1. **Jalankan Aplikasi**
   ```bash
   npm run dev
   # atau double-click: start-app.bat
   ```

2. **Login**
   - Buka: http://localhost:3000
   - Login sebagai admin

3. **Navigate**
   - Sidebar → "User & Role Management"

4. **Add User**
   - Klik tombol biru "Tambah User Baru" (kolom kiri)
   - Isi semua field
   - Pilih role dari dropdown
   - Klik "Buat User"

## ✅ Fitur CRUD Lengkap

### ✅ CREATE (Tambah)
- Tombol: "Tambah User Baru" (biru, kolom kiri)
- Modal form dengan validasi
- Auto hash password

### ✅ READ (Lihat)
- Tabel users di kolom kiri
- Tampil: nama, username, email, role, status
- Real-time data dari database

### ✅ UPDATE (Edit)
- Tombol "Edit" pada setiap row user
- Form pre-filled dengan data existing
- Password optional pada update

### ✅ DELETE (Hapus)
- Tombol "Delete" pada setiap row user
- Konfirmasi dialog sebelum hapus
- Safe deletion

## 🛠️ Troubleshooting

### Jika tombol tidak terlihat:
1. ✅ Pastikan login sebagai user dengan permission `manage_roles`
2. ✅ Pastikan di menu "User & Role Management" (bukan yang lain)
3. ✅ Scroll ke kolom kiri jika layar kecil

### Jika form error:
1. ✅ Pastikan ada roles di database
2. ✅ Check all required fields (*)
3. ✅ Username dan email harus unique

---

**Status**: ✅ CRUD User sudah implemented dan ready to use!
**Lokasi**: Kolom KIRI di halaman "User & Role Management"
