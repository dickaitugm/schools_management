const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('./database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Initialize database
const db = new Database();

// IPC handlers for database operations
ipcMain.handle('get-schools', async () => {
  return await db.getSchools();
});

ipcMain.handle('add-school', async (event, school) => {
  return await db.addSchool(school);
});

ipcMain.handle('update-school', async (event, id, school) => {
  return await db.updateSchool(id, school);
});

ipcMain.handle('delete-school', async (event, id) => {
  return await db.deleteSchool(id);
});

ipcMain.handle('get-teachers', async (event, schoolId) => {
  return await db.getTeachers(schoolId);
});

ipcMain.handle('add-teacher', async (event, teacher) => {
  return await db.addTeacher(teacher);
});

ipcMain.handle('update-teacher', async (event, id, teacher) => {
  return await db.updateTeacher(id, teacher);
});

ipcMain.handle('delete-teacher', async (event, id) => {
  return await db.deleteTeacher(id);
});

ipcMain.handle('get-students', async (event, schoolId) => {
  return await db.getStudents(schoolId);
});

ipcMain.handle('add-student', async (event, student) => {
  return await db.addStudent(student);
});

ipcMain.handle('update-student', async (event, id, student) => {
  return await db.updateStudent(id, student);
});

ipcMain.handle('delete-student', async (event, id) => {
  return await db.deleteStudent(id);
});

// Lesson operations
ipcMain.handle('get-lessons', async () => {
  return await db.getLessons();
});

ipcMain.handle('add-lesson', async (event, lesson) => {
  return await db.addLesson(lesson);
});

ipcMain.handle('update-lesson', async (event, id, lesson) => {
  return await db.updateLesson(id, lesson);
});

ipcMain.handle('delete-lesson', async (event, id) => {
  return await db.deleteLesson(id);
});

// Schedule operations
ipcMain.handle('get-schedules', async (event, filters) => {
  return await db.getSchedules(filters);
});

ipcMain.handle('add-schedule', async (event, schedule) => {
  return await db.addSchedule(schedule);
});

ipcMain.handle('update-schedule', async (event, id, schedule) => {
  return await db.updateSchedule(id, schedule);
});

ipcMain.handle('delete-schedule', async (event, id) => {
  return await db.deleteSchedule(id);
});

// Student Attendance operations
ipcMain.handle('get-student-attendance', async (event, scheduleId, studentId) => {
  return await db.getStudentAttendance(scheduleId, studentId);
});

ipcMain.handle('add-student-attendance', async (event, attendance) => {
  return await db.addStudentAttendance(attendance);
});

ipcMain.handle('update-student-attendance', async (event, id, attendance) => {
  return await db.updateStudentAttendance(id, attendance);
});

ipcMain.handle('delete-student-attendance', async (event, id) => {
  return await db.deleteStudentAttendance(id);
});

ipcMain.handle('get-students-for-schedule', async (event, scheduleId) => {
  return await db.getStudentsForSchedule(scheduleId);
});
