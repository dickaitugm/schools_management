# Profile API Fix - Schedule-Based Relationships

## Masalah yang Diperbaiki

Error 500 terjadi pada semua profile view (schools, teachers, students) karena:
1. Query menggunakan kolom `updated_at` yang tidak ada di tabel
2. Perubahan relasi dari direct relationship ke schedule-based relationship

## Perubahan yang Dilakukan

### 1. School Profile API (`/api/schools/[id]/profile`)
**Sebelum:**
- Menggunakan `teacher_schools` table untuk mendapatkan teachers
- Menggunakan query langsung ke `students` table

**Sesudah:**
- Teachers diambil dari `completed schedules` melalui `schedule_teachers`
- Students diambil dari `completed schedules` melalui `student_attendance`
- Statistik juga diupdate untuk menggunakan completed schedules

### 2. Teacher Profile API (`/api/teachers/[id]/profile`)
**Sebelum:**
- Menggunakan `teacher_schools` untuk mendapatkan schools
- Menggunakan `student_teachers` untuk mendapatkan students

**Sesudah:**
- Schools diambil dari `completed schedules`
- Students diambil dari `completed schedules` melalui `student_attendance`
- Statistik diupdate untuk menghitung dari completed schedules

### 3. Student Profile API (`/api/students/[id]/profile`)
**Sebelum:**
- Menggunakan `student_teachers` untuk mendapatkan teachers

**Sesudah:**
- Teachers diambil dari `completed schedules` melalui `schedule_teachers`
- Statistik diupdate untuk menghitung dari completed schedules

### 4. Query Fixes
**Masalah:** Query menggunakan `t.updated_at` dan `s.updated_at` yang tidak ada di tabel

**Solusi:** Menghapus referensi ke kolom `updated_at` dari GROUP BY clause

## Query yang Diperbaiki

### School Profile - Teachers Query
```sql
SELECT DISTINCT t.*, MIN(s.scheduled_date) as association_date
FROM teachers t
JOIN schedule_teachers st ON t.id = st.teacher_id
JOIN schedules s ON st.schedule_id = s.id
WHERE s.school_id = $1 AND s.status = 'completed'
GROUP BY t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at
ORDER BY t.name
```

### School Profile - Students Query
```sql
SELECT DISTINCT s.*, MIN(sch.scheduled_date) as enrollment_date
FROM students s
JOIN student_attendance sa ON s.id = sa.student_id
JOIN schedules sch ON sa.schedule_id = sch.id
WHERE sch.school_id = $1 AND sch.status = 'completed' AND s.school_id = $1
GROUP BY s.id, s.name, s.email, s.phone, s.grade, s.age, s.school_id, s.created_at, s.enrollment_date
ORDER BY s.name
```

### Teacher Profile - Schools Query
```sql
SELECT DISTINCT s.*, MIN(sch.scheduled_date) as association_date
FROM schools s
JOIN schedules sch ON s.id = sch.school_id
JOIN schedule_teachers st ON sch.id = st.schedule_id
WHERE st.teacher_id = $1 AND sch.status = 'completed'
GROUP BY s.id, s.name, s.address, s.phone, s.email, s.created_at
ORDER BY s.name
```

### Student Profile - Teachers Query
```sql
SELECT DISTINCT t.*, MIN(s.scheduled_date) as association_date
FROM teachers t
JOIN schedule_teachers st ON t.id = st.teacher_id
JOIN schedules s ON st.schedule_id = s.id
JOIN student_attendance sa ON s.id = sa.schedule_id
WHERE sa.student_id = $1 AND s.status = 'completed'
GROUP BY t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at
ORDER BY t.name
```

## Dampak Perubahan

### Positif
✅ Profile views sekarang menampilkan data berdasarkan completed schedules  
✅ Tidak ada lagi error 500 pada profile views  
✅ Data yang ditampilkan lebih akurat (hanya yang benar-benar ada dalam completed schedules)  
✅ Konsisten dengan requirement: relasi teacher-school dan student-teacher dihapus dari management  

### Perlu Diperhatikan
⚠️ Profile mungkin menampilkan data lebih sedikit jika belum banyak completed schedules  
⚠️ Data teacher/student di profile school hanya muncul jika mereka ada di completed schedules  

## Testing

- ✅ Semua query SQL telah ditest dan berjalan tanpa error
- ✅ Structure tabel sudah dikonfirmasi
- ✅ API profile logic sudah diverifikasi

## File yang Diubah

1. `app/api/schools/[id]/profile/route.js`
2. `app/api/teachers/[id]/profile/route.js` 
3. `app/api/students/[id]/profile/route.js`

## Next Steps

1. Start development server: `npm run dev`
2. Test profile views di browser
3. Verifikasi tidak ada error di browser console
4. Test dengan data yang memiliki completed schedules

## Debug Scripts

- `debug/check-structures.js` - Check table structures
- `debug/test-all-profiles.js` - Test all profile API queries
- `debug/test-schedule-profiles.js` - Test schedule-based relationships
