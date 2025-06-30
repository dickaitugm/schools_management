const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // School operations
  getSchools: () => ipcRenderer.invoke('get-schools'),
  addSchool: (school) => ipcRenderer.invoke('add-school', school),
  updateSchool: (id, school) => ipcRenderer.invoke('update-school', id, school),
  deleteSchool: (id) => ipcRenderer.invoke('delete-school', id),

  // Teacher operations
  getTeachers: (schoolId) => ipcRenderer.invoke('get-teachers', schoolId),
  addTeacher: (teacher) => ipcRenderer.invoke('add-teacher', teacher),
  updateTeacher: (id, teacher) => ipcRenderer.invoke('update-teacher', id, teacher),
  deleteTeacher: (id) => ipcRenderer.invoke('delete-teacher', id),

  // Student operations
  getStudents: (schoolId) => ipcRenderer.invoke('get-students', schoolId),
  addStudent: (student) => ipcRenderer.invoke('add-student', student),
  updateStudent: (id, student) => ipcRenderer.invoke('update-student', id, student),
  deleteStudent: (id) => ipcRenderer.invoke('delete-student', id),

  // Lesson operations
  getLessons: () => ipcRenderer.invoke('get-lessons'),
  addLesson: (lesson) => ipcRenderer.invoke('add-lesson', lesson),
  updateLesson: (id, lesson) => ipcRenderer.invoke('update-lesson', id, lesson),
  deleteLesson: (id) => ipcRenderer.invoke('delete-lesson', id),

  // Schedule operations
  getSchedules: (filters) => ipcRenderer.invoke('get-schedules', filters),
  addSchedule: (schedule) => ipcRenderer.invoke('add-schedule', schedule),
  updateSchedule: (id, schedule) => ipcRenderer.invoke('update-schedule', id, schedule),
  deleteSchedule: (id) => ipcRenderer.invoke('delete-schedule', id),

  // Student Attendance operations
  getStudentAttendance: (scheduleId, studentId) => ipcRenderer.invoke('get-student-attendance', scheduleId, studentId),
  addStudentAttendance: (attendance) => ipcRenderer.invoke('add-student-attendance', attendance),
  updateStudentAttendance: (id, attendance) => ipcRenderer.invoke('update-student-attendance', id, attendance),
  deleteStudentAttendance: (id) => ipcRenderer.invoke('delete-student-attendance', id),
  getStudentsForSchedule: (scheduleId) => ipcRenderer.invoke('get-students-for-schedule', scheduleId)
});
