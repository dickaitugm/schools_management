// Test script untuk menguji fitur penyamaran nama siswa
const { maskStudentName, conditionallyMaskStudentName } = require('../utils/privacyUtils');

// Beberapa contoh nama untuk pengujian
const names = [
  'John Doe',
  'Jane Smith',
  'Muhammad Abdullah',
  'Budi Santoso',
  'Siti Nurhaliza',
  'Agus Widodo',
  'Dewi Sukarno',
  'Bambang Pamungkas'
];

// Pengujian fungsi maskStudentName
console.log('===== Pengujian maskStudentName dengan Nama Acak =====');
console.log('Pengujian nama acak (mode default):');
names.forEach(name => {
  console.log(`${name} → ${maskStudentName(name)}`);
});

// Uji konsistensi - nama yang sama harus menghasilkan nama acak yang sama
console.log('\n===== Uji Konsistensi Nama Acak =====');
console.log('Pengulangan 3 kali untuk nama yang sama:');
for (let i = 0; i < 3; i++) {
  console.log(`Iterasi ${i+1}:`);
  names.forEach(name => {
    console.log(`${name} → ${maskStudentName(name)}`);
  });
  console.log('');
}

// Pengujian mode masking lama (inisial)
console.log('===== Pengujian maskStudentName dengan Mode Inisial =====');
console.log('Dengan preserveFirstName = true, preserveInitials = true, useRandomNames = false:');
names.forEach(name => {
  console.log(`${name} → ${maskStudentName(name, { preserveFirstName: true, preserveInitials: true, useRandomNames: false })}`);
});

console.log('\nDengan preserveFirstName = false, preserveInitials = true, useRandomNames = false:');
names.forEach(name => {
  console.log(`${name} → ${maskStudentName(name, { preserveFirstName: false, preserveInitials: true, useRandomNames: false })}`);
});

// Pengujian fungsi conditionallyMaskStudentName
console.log('\n===== Pengujian conditionallyMaskStudentName =====');

// Pengujian untuk user = null (guest)
console.log('\nPengguna tidak login:');
names.forEach(name => {
  console.log(`${name} → ${conditionallyMaskStudentName(name, null)}`);
});

// Pengujian untuk user = guest
console.log('\nPengguna login sebagai guest:');
const guestUser = { id: 'guest', role: 'guest', name: 'Guest User' };
names.forEach(name => {
  console.log(`${name} → ${conditionallyMaskStudentName(name, guestUser)}`);
});

// Pengujian untuk user = teacher
console.log('\nPengguna login sebagai guru:');
const teacherUser = { id: '123', role: 'teachers', name: 'Teacher User' };
names.forEach(name => {
  console.log(`${name} → ${conditionallyMaskStudentName(name, teacherUser)}`);
});

// Pengujian untuk user = admin
console.log('\nPengguna login sebagai admin:');
const adminUser = { id: '456', role: 'admin', name: 'Admin User' };
names.forEach(name => {
  console.log(`${name} → ${conditionallyMaskStudentName(name, adminUser)}`);
});

console.log('\nUji Selesai!');
