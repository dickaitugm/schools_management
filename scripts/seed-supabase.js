// Load environment variables
require('dotenv').config({ path: '.env.local' });

const pool = require('../lib/db-supabase');

async function seedSupabaseDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding Supabase database with sample data...');

    // Clear existing data in reverse order of dependencies
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM schedule_lessons');
    await client.query('DELETE FROM schedule_teachers');
    await client.query('DELETE FROM lesson_teachers');
    await client.query('DELETE FROM student_teachers');
    await client.query('DELETE FROM teacher_schools');
    await client.query('DELETE FROM student_attendance');
    await client.query('DELETE FROM schedules');
    await client.query('DELETE FROM lessons');
    await client.query('DELETE FROM students');
    await client.query('DELETE FROM teachers');
    await client.query('DELETE FROM schools');
    console.log('✅ Existing data cleared');

    // Insert sample schools
    const schoolsResult = await client.query(`
      INSERT INTO schools (name, address, phone, email) VALUES 
      ('SD Harapan Bangsa', 'Jl. Pendidikan No. 123, Jakarta Selatan', '021-12345678', 'info@sdharapan.sch.id'),
      ('SMP Tunas Muda', 'Jl. Pemuda No. 456, Jakarta Timur', '021-87654321', 'admin@smptunas.sch.id'),
      ('SMA Cerdas Berkarya', 'Jl. Cerdas No. 789, Jakarta Utara', '021-11223344', 'contact@smacerdas.sch.id'),
      ('TK Bintang Kecil', 'Jl. Anak No. 111, Jakarta Barat', '021-55667788', 'info@tkbintang.sch.id'),
      ('SMK Teknik Maju', 'Jl. Teknologi No. 222, Jakarta Pusat', '021-99887766', 'admin@smkteknologi.sch.id')
      RETURNING id, name
    `);
    
    console.log('✅ Schools seeded:', schoolsResult.rows.map(s => s.name));

    // Insert sample teachers
    const teachersResult = await client.query(`
      INSERT INTO teachers (name, subject, phone, email, hire_date) VALUES 
      ('Budi Santoso', 'Matematika', '081234567890', 'budi@email.com', '2020-01-15'),
      ('Sari Dewi', 'Bahasa Indonesia', '081234567891', 'sari@email.com', '2019-08-10'),
      ('Ahmad Rahman', 'IPA', '081234567892', 'ahmad@email.com', '2021-03-01'),
      ('Maya Sari', 'IPS', '081234567893', 'maya@email.com', '2020-09-15'),
      ('Rina Pratiwi', 'Bahasa Inggris', '081234567894', 'rina@email.com', '2018-06-20'),
      ('Dedi Kurniawan', 'Matematika', '081234567810', 'dedi@email.com', '2019-05-10'),
      ('Lina Handayani', 'Seni Budaya', '081234567811', 'lina@email.com', '2021-09-01'),
      ('Rudi Hartono', 'Olahraga', '081234567812', 'rudi@email.com', '2020-03-15'),
      ('Siska Wulandari', 'PKn', '081234567813', 'siska@email.com', '2019-11-20'),
      ('Tony Setiawan', 'Teknologi Informasi', '081234567814', 'tony@email.com', '2022-01-10')
      RETURNING id, name
    `);
    
    console.log('✅ Teachers seeded:', teachersResult.rows.map(t => t.name));

    // Assign teachers to schools (many-to-many relationship)
    await client.query(`
      INSERT INTO teacher_schools (teacher_id, school_id) VALUES 
      (1, 1), (1, 2),   -- Budi teaches at SD Harapan Bangsa and SMP Tunas Muda
      (2, 1), (2, 3),   -- Sari teaches at SD Harapan Bangsa and SMA Cerdas Berkarya  
      (3, 2), (3, 3),   -- Ahmad teaches at SMP Tunas Muda and SMA Cerdas Berkarya
      (4, 1), (4, 2),   -- Maya teaches at SD Harapan Bangsa and SMP Tunas Muda
      (5, 2), (5, 3),   -- Rina teaches at SMP Tunas Muda and SMA Cerdas Berkarya
      (6, 1), (6, 5),   -- Dedi teaches at SD Harapan Bangsa and SMK Teknik Maju
      (7, 4), (7, 1),   -- Lina teaches at TK Bintang Kecil and SD Harapan Bangsa
      (8, 4), (8, 1), (8, 2),  -- Rudi teaches at TK, SD, and SMP
      (9, 3), (9, 5),   -- Siska teaches at SMA Cerdas Berkarya and SMK Teknik Maju
      (10, 5), (10, 3)  -- Tony teaches at SMK Teknik Maju and SMA Cerdas Berkarya
    `);

    console.log('✅ Teacher-School relationships created');

    // Insert sample students
    const studentsResult = await client.query(`
      INSERT INTO students (school_id, name, grade, phone, email, enrollment_date) VALUES 
      (1, 'Andi Wijaya', 'Kelas 5', '081234567895', 'andi@student.com', '2023-07-15'),
      (1, 'Bella Putri', 'Kelas 4', '081234567896', 'bella@student.com', '2023-07-15'),
      (1, 'Citra Sari', 'Kelas 6', '081234567897', 'citra@student.com', '2022-07-15'),
      (1, 'Dimas Pratama', 'Kelas 3', '081234567820', 'dimas@student.com', '2023-07-15'),
      (2, 'Doni Pratama', 'Kelas 8', '081234567898', 'doni@student.com', '2023-07-15'),
      (2, 'Eka Saputra', 'Kelas 7', '081234567899', 'eka@student.com', '2023-07-15'),
      (2, 'Fani Wijayanti', 'Kelas 9', '081234567821', 'fani@student.com', '2022-07-15'),
      (3, 'Fira Ningsih', 'Kelas 11', '081234567800', 'fira@student.com', '2023-07-15'),
      (3, 'Gilang Ramadan', 'Kelas 12', '081234567801', 'gilang@student.com', '2022-07-15'),
      (3, 'Hana Savitri', 'Kelas 10', '081234567822', 'hana@student.com', '2023-07-15'),
      (4, 'Iko Nugroho', 'Kelompok B', '081234567823', 'iko@student.com', '2023-07-15'),
      (4, 'Jihan Amelia', 'Kelompok A', '081234567824', 'jihan@student.com', '2023-07-15'),
      (5, 'Kevin Pratama', 'Kelas XI RPL', '081234567825', 'kevin@student.com', '2023-07-15'),
      (5, 'Lisa Maharani', 'Kelas XII TKJ', '081234567826', 'lisa@student.com', '2022-07-15')
      RETURNING id, name, school_id
    `);
    
    console.log('✅ Students seeded:', studentsResult.rows.map(s => `${s.name} (School ${s.school_id})`));

    // Assign students to teachers (many-to-many relationship)
    await client.query(`
      INSERT INTO student_teachers (student_id, teacher_id) VALUES 
      (1, 1), (1, 2),   -- Andi learns from Budi (Math) and Sari (Indonesian)
      (2, 1), (2, 4),   -- Bella learns from Budi (Math) and Maya (Social Studies)
      (3, 1), (3, 2),   -- Citra learns from Budi (Math) and Sari (Indonesian)
      (4, 1), (4, 7),   -- Dimas learns from Budi (Math) and Lina (Arts)
      (5, 3), (5, 5),   -- Doni learns from Ahmad (Science) and Rina (English)
      (6, 3), (6, 5),   -- Eka learns from Ahmad (Science) and Rina (English)
      (7, 3), (7, 4),   -- Fani learns from Ahmad (Science) and Maya (Social Studies)
      (8, 3), (8, 5),   -- Fira learns from Ahmad (Science) and Rina (English)
      (9, 2), (9, 5),   -- Gilang learns from Sari (Indonesian) and Rina (English)
      (10, 3), (10, 9), -- Hana learns from Ahmad (Science) and Siska (Civics)
      (11, 7), (11, 8), -- Iko learns from Lina (Arts) and Rudi (Sports)
      (12, 7), (12, 8), -- Jihan learns from Lina (Arts) and Rudi (Sports)
      (13, 10), (13, 6), -- Kevin learns from Tony (IT) and Dedi (Math)
      (14, 10), (14, 9)  -- Lisa learns from Tony (IT) and Siska (Civics)
    `);

    console.log('✅ Student-Teacher relationships created');

    // Insert sample lessons
    const lessonsResult = await client.query(`
      INSERT INTO lessons (title, description, duration_minutes, materials, target_grade) VALUES 
      ('Pengenalan Alkitab', 'Pelajaran dasar tentang struktur dan isi Alkitab', 60, 'Alkitab, buku tulis, pensil', 'Semua tingkat'),
      ('Doa dan Ibadah', 'Mengajarkan cara berdoa dan beribadah yang benar', 45, 'Buku doa, musik rohani', 'Semua tingkat'),
      ('Sejarah Kekristenan', 'Mempelajari sejarah perkembangan agama Kristen', 90, 'Buku sejarah, presentasi', 'SMP, SMA'),
      ('Karakter Kristiani', 'Pembentukan karakter berdasarkan nilai-nilai Kristiani', 60, 'Studi kasus, diskusi kelompok', 'Semua tingkat'),
      ('Musik Rohani', 'Pembelajaran lagu-lagu rohani dan pujian', 60, 'Alat musik, lirik lagu', 'Semua tingkat'),
      ('Cerita Alkitab untuk Anak', 'Mengenalkan tokoh-tokoh Alkitab dengan cara yang menyenangkan', 45, 'Buku cerita bergambar, boneka', 'TK, SD'),
      ('Etika Kristiani', 'Pembelajaran tentang nilai-nilai moral dan etika Kristen', 75, 'Materi diskusi, video pembelajaran', 'SMP, SMA'),
      ('Pelayanan dan Kasih', 'Mengajarkan pentingnya melayani sesama dengan kasih', 60, 'Studi kasus pelayanan, aktivitas kelompok', 'Semua tingkat')
      RETURNING id, title
    `);
    
    console.log('✅ Lessons seeded:', lessonsResult.rows.map(l => l.title));

    // Assign lessons to teachers (many-to-many relationship)
    await client.query(`
      INSERT INTO lesson_teachers (lesson_id, teacher_id) VALUES 
      (1, 2), (1, 4),   -- Pengenalan Alkitab: Sari (Indonesian) and Maya (Social Studies)
      (2, 2), (2, 5),   -- Doa dan Ibadah: Sari (Indonesian) and Rina (English)
      (3, 2), (3, 4),   -- Sejarah Kekristenan: Sari (Indonesian) and Maya (Social Studies)
      (4, 2), (4, 4), (4, 5),  -- Karakter Kristiani: Sari, Maya, and Rina
      (5, 5), (5, 7),   -- Musik Rohani: Rina (English) and Lina (Arts)
      (6, 7), (6, 8),   -- Cerita Alkitab untuk Anak: Lina (Arts) and Rudi (Sports)
      (7, 9), (7, 4),   -- Etika Kristiani: Siska (Civics) and Maya (Social Studies)
      (8, 2), (8, 9), (8, 5)  -- Pelayanan dan Kasih: Sari, Siska, and Rina
    `);

    console.log('✅ Lesson-Teacher relationships created');

    // Insert sample schedules
    const schedulesResult = await client.query(`
      INSERT INTO schedules (school_id, scheduled_date, scheduled_time, duration_minutes, status, notes) VALUES 
      (1, '2025-01-10', '09:00:00', 90, 'scheduled', 'Matematika dasar untuk kelas 5'),
      (1, '2025-01-12', '10:30:00', 60, 'scheduled', 'Bahasa Indonesia - membaca dan menulis'),
      (1, '2025-01-15', '14:00:00', 45, 'scheduled', 'Cerita Alkitab untuk anak-anak'),
      (2, '2025-01-15', '08:00:00', 120, 'scheduled', 'IPA - eksperimen sederhana'),
      (2, '2025-01-18', '13:30:00', 90, 'completed', 'IPS - sejarah Indonesia'),
      (2, '2025-01-20', '09:30:00', 75, 'scheduled', 'Karakter Kristiani untuk remaja'),
      (3, '2025-01-20', '11:00:00', 90, 'scheduled', 'Bahasa Inggris - conversation practice'),
      (3, '2025-01-22', '15:00:00', 90, 'scheduled', 'Sejarah Kekristenan'),
      (4, '2025-01-25', '10:00:00', 60, 'scheduled', 'Musik rohani dan lagu anak'),
      (5, '2025-01-28', '13:00:00', 120, 'scheduled', 'Teknologi Informasi dasar')
      RETURNING id, school_id, scheduled_date
    `);
    
    console.log('✅ Schedules seeded:', schedulesResult.rows.length, 'schedules created');

    // Assign teachers to schedules
    await client.query(`
      INSERT INTO schedule_teachers (schedule_id, teacher_id) VALUES 
      (1, 1),   -- Budi teaches schedule 1 (Math)
      (2, 2),   -- Sari teaches schedule 2 (Indonesian)
      (3, 7),   -- Lina teaches schedule 3 (Bible stories)
      (4, 3),   -- Ahmad teaches schedule 4 (Science)
      (5, 4),   -- Maya teaches schedule 5 (Social Studies)
      (6, 2),   -- Sari teaches schedule 6 (Character building)
      (7, 5),   -- Rina teaches schedule 7 (English)
      (8, 4),   -- Maya teaches schedule 8 (Christian History)
      (9, 7),   -- Lina teaches schedule 9 (Sacred music)
      (10, 10)  -- Tony teaches schedule 10 (IT)
    `);

    // Assign lessons to schedules
    await client.query(`
      INSERT INTO schedule_lessons (schedule_id, lesson_id) VALUES 
      (1, 1),   -- Math lesson in schedule 1
      (2, 2),   -- Indonesian lesson in schedule 2
      (3, 6),   -- Bible stories lesson in schedule 3
      (4, 1),   -- Bible introduction lesson in schedule 4
      (5, 3),   -- Christian history lesson in schedule 5
      (6, 4),   -- Christian character lesson in schedule 6
      (7, 2),   -- Prayer and worship lesson in schedule 7
      (8, 3),   -- Christian history lesson in schedule 8
      (9, 5),   -- Sacred music lesson in schedule 9
      (10, 4)   -- Character building lesson in schedule 10
    `);

    console.log('✅ Schedule assignments created');

    // Insert sample assessments using student_attendance table
    await client.query(`
      INSERT INTO student_attendance (schedule_id, student_id, attendance_status, knowledge_score, participation_score, personal_development_level, critical_thinking_level, team_work_level, academic_knowledge_level, notes) VALUES 
      (1, 1, 'present', 85, 80, 3, 3, 4, 3, 'Baik dalam pemahaman konsep matematika dasar'),
      (1, 2, 'present', 78, 75, 3, 2, 3, 3, 'Perlu lebih banyak latihan soal matematika'),
      (2, 1, 'present', 92, 90, 4, 4, 4, 4, 'Sangat baik dalam membaca dan menulis'),
      (2, 3, 'present', 88, 85, 4, 3, 4, 4, 'Pemahaman grammar sudah baik'),
      (5, 5, 'present', 90, 87, 4, 4, 3, 4, 'Pemahaman sejarah Indonesia sangat baik'),
      (5, 6, 'present', 82, 78, 3, 3, 3, 3, 'Perlu meningkatkan hafalan tanggal penting'),
      (7, 8, 'present', 87, 90, 4, 3, 4, 3, 'Conversation practice berjalan dengan baik'),
      (7, 9, 'present', 95, 95, 4, 4, 4, 4, 'Excellent English speaking skills')
    `);

    console.log('✅ Student assessments created');

    console.log('🎉 Supabase database seeding completed successfully!');

    // Display summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM schools) as schools_count,
        (SELECT COUNT(*) FROM teachers) as teachers_count,
        (SELECT COUNT(*) FROM students) as students_count,
        (SELECT COUNT(*) FROM lessons) as lessons_count,
        (SELECT COUNT(*) FROM schedules) as schedules_count,
        (SELECT COUNT(*) FROM student_attendance) as assessments_count
    `);

    console.log('📊 Database Summary:');
    console.log(`   Schools: ${summary.rows[0].schools_count}`);
    console.log(`   Teachers: ${summary.rows[0].teachers_count}`);
    console.log(`   Students: ${summary.rows[0].students_count}`);
    console.log(`   Lessons: ${summary.rows[0].lessons_count}`);
    console.log(`   Schedules: ${summary.rows[0].schedules_count}`);
    console.log(`   Assessments: ${summary.rows[0].assessments_count}`);
    
  } catch (error) {
    console.error('❌ Error seeding Supabase database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seeding if script is called directly
if (require.main === module) {
  seedSupabaseDatabase()
    .then(() => {
      console.log('✨ Supabase seeding process finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Supabase seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedSupabaseDatabase;
