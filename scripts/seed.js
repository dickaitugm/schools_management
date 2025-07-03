const pool = require('../lib/db');

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database with sample data...');

    // Insert sample schools
    const schoolsResult = await client.query(`
      INSERT INTO schools (name, address, phone, email) VALUES 
      ('SD Harapan Bangsa', 'Jl. Pendidikan No. 123, Jakarta Selatan', '021-12345678', 'info@sdharapan.sch.id'),
      ('SMP Tunas Muda', 'Jl. Pemuda No. 456, Jakarta Timur', '021-87654321', 'admin@smptunas.sch.id'),
      ('SMA Cerdas Berkarya', 'Jl. Cerdas No. 789, Jakarta Utara', '021-11223344', 'contact@smacerdas.sch.id')
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
      ('Rina Pratiwi', 'Bahasa Inggris', '081234567894', 'rina@email.com', '2018-06-20')
      RETURNING id, name
    `);
    
    console.log('✅ Teachers seeded:', teachersResult.rows.map(t => t.name));

    // Assign teachers to schools (many-to-many relationship)
    await client.query(`
      INSERT INTO teacher_schools (teacher_id, school_id) VALUES 
      (1, 1), (1, 2),  -- Budi teaches at SD Harapan Bangsa and SMP Tunas Muda
      (2, 1), (2, 3),  -- Sari teaches at SD Harapan Bangsa and SMA Cerdas Berkarya  
      (3, 2), (3, 3),  -- Ahmad teaches at SMP Tunas Muda and SMA Cerdas Berkarya
      (4, 1),          -- Maya teaches at SD Harapan Bangsa
      (5, 2), (5, 3)   -- Rina teaches at SMP Tunas Muda and SMA Cerdas Berkarya
    `);

    console.log('✅ Teacher-School relationships created');

    // Insert sample students
    const studentsResult = await client.query(`
      INSERT INTO students (school_id, name, grade, phone, email, enrollment_date) VALUES 
      (1, 'Andi Wijaya', 'Kelas 5', '081234567895', 'andi@student.com', '2023-07-15'),
      (1, 'Bella Putri', 'Kelas 4', '081234567896', 'bella@student.com', '2023-07-15'),
      (1, 'Citra Sari', 'Kelas 6', '081234567897', 'citra@student.com', '2022-07-15'),
      (2, 'Doni Pratama', 'Kelas 8', '081234567898', 'doni@student.com', '2023-07-15'),
      (2, 'Eka Saputra', 'Kelas 7', '081234567899', 'eka@student.com', '2023-07-15'),
      (3, 'Fira Ningsih', 'Kelas 11', '081234567800', 'fira@student.com', '2023-07-15'),
      (3, 'Gilang Ramadan', 'Kelas 12', '081234567801', 'gilang@student.com', '2022-07-15')
      RETURNING id, name, school_id
    `);
    
    console.log('✅ Students seeded:', studentsResult.rows.map(s => `${s.name} (School ${s.school_id})`));

    // Assign students to teachers (many-to-many relationship)
    await client.query(`
      INSERT INTO student_teachers (student_id, teacher_id) VALUES 
      (1, 1), (1, 2),  -- Andi learns from Budi (Math) and Sari (Indonesian)
      (2, 1), (2, 4),  -- Bella learns from Budi (Math) and Maya (Social Studies)
      (3, 1), (3, 2),  -- Citra learns from Budi (Math) and Sari (Indonesian)
      (4, 3), (4, 5),  -- Doni learns from Ahmad (Science) and Rina (English)
      (5, 3), (5, 5),  -- Eka learns from Ahmad (Science) and Rina (English)
      (6, 3), (6, 5),  -- Fira learns from Ahmad (Science) and Rina (English)
      (7, 2), (7, 5)   -- Gilang learns from Sari (Indonesian) and Rina (English)
    `);

    console.log('✅ Student-Teacher relationships created');
    
    console.log('✅ Students seeded:', studentsResult.rows.map(s => `${s.name} (School ${s.school_id})`));

    // Insert sample lessons
    const lessonsResult = await client.query(`
      INSERT INTO lessons (title, description, duration_minutes, materials, target_grade) VALUES 
      ('Pengenalan Alkitab', 'Pelajaran dasar tentang struktur dan isi Alkitab', 60, 'Alkitab, buku tulis, pensil', 'Semua tingkat'),
      ('Doa dan Ibadah', 'Mengajarkan cara berdoa dan beribadah yang benar', 45, 'Buku doa, musik rohani', 'Semua tingkat'),
      ('Sejarah Kekristenan', 'Mempelajari sejarah perkembangan agama Kristen', 90, 'Buku sejarah, presentasi', 'SMP, SMA'),
      ('Karakter Kristiani', 'Pembentukan karakter berdasarkan nilai-nilai Kristiani', 60, 'Studi kasus, diskusi kelompok', 'Semua tingkat'),
      ('Musik Rohani', 'Pembelajaran lagu-lagu rohani dan pujian', 60, 'Alat musik, lirik lagu', 'Semua tingkat')
      RETURNING id, title
    `);
    
    console.log('✅ Lessons seeded:', lessonsResult.rows.map(l => l.title));

    // Assign lessons to teachers (many-to-many relationship)
    await client.query(`
      INSERT INTO lesson_teachers (lesson_id, teacher_id) VALUES 
      (1, 2), (1, 4),  -- Pengenalan Alkitab: Sari (Indonesian) and Maya (Social Studies)
      (2, 2), (2, 5),  -- Doa dan Ibadah: Sari (Indonesian) and Rina (English)
      (3, 2), (3, 4),  -- Sejarah Kekristenan: Sari (Indonesian) and Maya (Social Studies)
      (4, 2), (4, 4), (4, 5),  -- Karakter Kristiani: Sari, Maya, and Rina
      (5, 5)           -- Musik Rohani: Rina (English)
    `);

    console.log('✅ Lesson-Teacher relationships created');

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seeding if script is called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✨ Seeding process finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
