@echo off
echo Membersihkan cache...
rmdir /s /q .next
del /f /q .babelrc

echo Menginstall dependensi...
npm install

echo Menjalankan aplikasi...
npm run dev
