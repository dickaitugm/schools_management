const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

class Database {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'school_management.db');
    this.db = new sqlite3.Database(dbPath);
    this.initTables();
  }

  initTables() {
    const createSchoolsTable = `
      CREATE TABLE IF NOT EXISTS schools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createTeachersTable = `
      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subject TEXT,
        phone TEXT,
        email TEXT,
        hire_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createTeacherSchoolsTable = `
      CREATE TABLE IF NOT EXISTS teacher_schools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER,
        school_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE,
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE,
        UNIQUE(teacher_id, school_id)
      )
    `;

    const createScheduleTeachersTable = `
      CREATE TABLE IF NOT EXISTS schedule_teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER,
        teacher_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE,
        UNIQUE(schedule_id, teacher_id)
      )
    `;

    const createScheduleLessonsTable = `
      CREATE TABLE IF NOT EXISTS schedule_lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER,
        lesson_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
        UNIQUE(schedule_id, lesson_id)
      )
    `;

    const createStudentsTable = `
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER,
        name TEXT NOT NULL,
        grade TEXT,
        age INTEGER,
        phone TEXT,
        email TEXT,
        enrollment_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
      )
    `;

    const createLessonsTable = `
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        duration_minutes INTEGER DEFAULT 60,
        materials TEXT,
        target_grade TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createSchedulesTable = `
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER,
        scheduled_date DATE NOT NULL,
        scheduled_time TIME NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
      )
    `;

    const createStudentAttendanceTable = `
      CREATE TABLE IF NOT EXISTS student_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER,
        student_id INTEGER,
        attendance_status TEXT DEFAULT 'present', -- present, absent, late
        knowledge_score INTEGER, -- 0-100
        participation_score INTEGER, -- 0-100
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
        UNIQUE(schedule_id, student_id)
      )
    `;

    this.db.serialize(() => {
      this.db.run(createSchoolsTable);
      this.db.run(createTeachersTable);
      this.db.run(createTeacherSchoolsTable);
      this.db.run(createStudentsTable);
      this.db.run(createLessonsTable);
      this.db.run(createSchedulesTable);
      this.db.run(createScheduleTeachersTable);
      this.db.run(createScheduleLessonsTable);
      this.db.run(createStudentAttendanceTable);
    });
  }

  // School operations
  getSchools() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM schools ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  addSchool(school) {
    return new Promise((resolve, reject) => {
      const { name, address, phone, email } = school;
      this.db.run(
        'INSERT INTO schools (name, address, phone, email) VALUES (?, ?, ?, ?)',
        [name, address, phone, email],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...school });
        }
      );
    });
  }

  updateSchool(id, school) {
    return new Promise((resolve, reject) => {
      const { name, address, phone, email } = school;
      this.db.run(
        'UPDATE schools SET name = ?, address = ?, phone = ?, email = ? WHERE id = ?',
        [name, address, phone, email, id],
        function(err) {
          if (err) reject(err);
          else resolve({ id, ...school });
        }
      );
    });
  }

  deleteSchool(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM schools WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  // Teacher operations
  getTeachers(schoolId) {
    return new Promise((resolve, reject) => {
      let query, params;
      
      if (schoolId) {
        query = `
          SELECT DISTINCT t.*, GROUP_CONCAT(s.name) as school_names, GROUP_CONCAT(s.id) as school_ids
          FROM teachers t
          LEFT JOIN teacher_schools ts ON t.id = ts.teacher_id
          LEFT JOIN schools s ON ts.school_id = s.id
          WHERE ts.school_id = ?
          GROUP BY t.id
          ORDER BY t.name
        `;
        params = [schoolId];
      } else {
        query = `
          SELECT t.*, GROUP_CONCAT(s.name) as school_names, GROUP_CONCAT(s.id) as school_ids
          FROM teachers t
          LEFT JOIN teacher_schools ts ON t.id = ts.teacher_id
          LEFT JOIN schools s ON ts.school_id = s.id
          GROUP BY t.id
          ORDER BY t.name
        `;
        params = [];
      }
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  addTeacher(teacher) {
    return new Promise((resolve, reject) => {
      const { name, subject, phone, email, hire_date, school_ids } = teacher;
      const db = this.db; // Store reference to avoid context issues
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Insert teacher
        db.run(
          'INSERT INTO teachers (name, subject, phone, email, hire_date) VALUES (?, ?, ?, ?, ?)',
          [name, subject, phone, email, hire_date],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            const teacherId = this.lastID;
            
            // Insert teacher-school relationships
            if (school_ids && school_ids.length > 0) {
              const stmt = db.prepare('INSERT INTO teacher_schools (teacher_id, school_id) VALUES (?, ?)');
              
              let completed = 0;
              let hasError = false;
              
              school_ids.forEach(schoolId => {
                stmt.run([teacherId, schoolId], function(err) {
                  if (err && !hasError) {
                    hasError = true;
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }
                  
                  completed++;
                  if (completed === school_ids.length && !hasError) {
                    stmt.finalize();
                    db.run('COMMIT');
                    resolve({ id: teacherId, ...teacher });
                  }
                });
              });
            } else {
              db.run('COMMIT');
              resolve({ id: teacherId, ...teacher });
            }
          }
        );
      });
    });
  }

  updateTeacher(id, teacher) {
    return new Promise((resolve, reject) => {
      const { name, subject, phone, email, hire_date, school_ids } = teacher;
      const db = this.db; // Store reference to avoid context issues
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Update teacher
        db.run(
          'UPDATE teachers SET name = ?, subject = ?, phone = ?, email = ?, hire_date = ? WHERE id = ?',
          [name, subject, phone, email, hire_date, id],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            // Delete existing teacher-school relationships
            db.run('DELETE FROM teacher_schools WHERE teacher_id = ?', [id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              // Insert new teacher-school relationships
              if (school_ids && school_ids.length > 0) {
                const stmt = db.prepare('INSERT INTO teacher_schools (teacher_id, school_id) VALUES (?, ?)');
                
                let completed = 0;
                let hasError = false;
                
                school_ids.forEach(schoolId => {
                  stmt.run([id, schoolId], function(err) {
                    if (err && !hasError) {
                      hasError = true;
                      db.run('ROLLBACK');
                      reject(err);
                      return;
                    }
                    
                    completed++;
                    if (completed === school_ids.length && !hasError) {
                      stmt.finalize();
                      db.run('COMMIT');
                      resolve({ id, ...teacher });
                    }
                  });
                });
              } else {
                db.run('COMMIT');
                resolve({ id, ...teacher });
              }
            });
          }
        );
      });
    });
  }

  deleteTeacher(id) {
    return new Promise((resolve, reject) => {
      const db = this.db; // Store reference to avoid context issues
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete teacher-school relationships
        db.run('DELETE FROM teacher_schools WHERE teacher_id = ?', [id], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          // Delete teacher
          db.run('DELETE FROM teachers WHERE id = ?', [id], function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            } else {
              db.run('COMMIT');
              resolve({ deleted: this.changes > 0 });
            }
          });
        });
      });
    });
  }

  // Student operations
  getStudents(schoolId) {
    return new Promise((resolve, reject) => {
      const query = schoolId 
        ? 'SELECT * FROM students WHERE school_id = ? ORDER BY name'
        : 'SELECT * FROM students ORDER BY name';
      
      const params = schoolId ? [schoolId] : [];
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  addStudent(student) {
    return new Promise((resolve, reject) => {
      const { school_id, name, grade, age, phone, email, enrollment_date } = student;
      this.db.run(
        'INSERT INTO students (school_id, name, grade, age, phone, email, enrollment_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [school_id, name, grade, age, phone, email, enrollment_date],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...student });
        }
      );
    });
  }

  updateStudent(id, student) {
    return new Promise((resolve, reject) => {
      const { school_id, name, grade, age, phone, email, enrollment_date } = student;
      this.db.run(
        'UPDATE students SET school_id = ?, name = ?, grade = ?, age = ?, phone = ?, email = ?, enrollment_date = ? WHERE id = ?',
        [school_id, name, grade, age, phone, email, enrollment_date, id],
        function(err) {
          if (err) reject(err);
          else resolve({ id, ...student });
        }
      );
    });
  }

  deleteStudent(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  // Lesson operations
  getLessons() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM lessons ORDER BY title', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  addLesson(lesson) {
    return new Promise((resolve, reject) => {
      const { title, description, duration_minutes, materials, target_grade } = lesson;
      this.db.run(
        'INSERT INTO lessons (title, description, duration_minutes, materials, target_grade) VALUES (?, ?, ?, ?, ?)',
        [title, description, duration_minutes, materials, target_grade],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...lesson });
        }
      );
    });
  }

  updateLesson(id, lesson) {
    return new Promise((resolve, reject) => {
      const { title, description, duration_minutes, materials, target_grade } = lesson;
      this.db.run(
        'UPDATE lessons SET title = ?, description = ?, duration_minutes = ?, materials = ?, target_grade = ? WHERE id = ?',
        [title, description, duration_minutes, materials, target_grade, id],
        function(err) {
          if (err) reject(err);
          else resolve({ id, ...lesson });
        }
      );
    });
  }

  deleteLesson(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM lessons WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  // Schedule operations
  getSchedules(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT s.*, sch.name as school_name,
        GROUP_CONCAT(DISTINCT l.title) as lesson_titles,
        GROUP_CONCAT(DISTINCT l.id) as lesson_ids,
        GROUP_CONCAT(DISTINCT t.name) as teacher_names,
        GROUP_CONCAT(DISTINCT t.id) as teacher_ids
        FROM schedules s
        LEFT JOIN schools sch ON s.school_id = sch.id
        LEFT JOIN schedule_lessons sl ON s.id = sl.schedule_id
        LEFT JOIN lessons l ON sl.lesson_id = l.id
        LEFT JOIN schedule_teachers st ON s.id = st.schedule_id
        LEFT JOIN teachers t ON st.teacher_id = t.id
      `;
      
      const conditions = [];
      const params = [];
      
      if (filters.school_id) {
        conditions.push('s.school_id = ?');
        params.push(filters.school_id);
      }
      
      if (filters.lesson_id) {
        conditions.push('sl.lesson_id = ?');
        params.push(filters.lesson_id);
      }
      
      if (filters.teacher_id) {
        conditions.push('st.teacher_id = ?');
        params.push(filters.teacher_id);
      }
      
      if (filters.date_from) {
        conditions.push('s.scheduled_date >= ?');
        params.push(filters.date_from);
      }
      
      if (filters.date_to) {
        conditions.push('s.scheduled_date <= ?');
        params.push(filters.date_to);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY s.id ORDER BY s.scheduled_date, s.scheduled_time';
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else {
          // Process the results to convert comma-separated strings to arrays
          const processedRows = rows.map(row => ({
            ...row,
            lesson_titles: row.lesson_titles ? row.lesson_titles.split(',') : [],
            lesson_ids: row.lesson_ids ? row.lesson_ids.split(',').map(id => parseInt(id)) : [],
            teacher_names: row.teacher_names ? row.teacher_names.split(',') : [],
            teacher_ids: row.teacher_ids ? row.teacher_ids.split(',').map(id => parseInt(id)) : []
          }));
          resolve(processedRows);
        }
      });
    });
  }

  addSchedule(schedule) {
    return new Promise((resolve, reject) => {
      const { lesson_ids, school_id, teacher_ids, scheduled_date, scheduled_time, duration_minutes, status, notes } = schedule;
      const db = this.db; // Store reference to avoid context issues
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Insert schedule (without lesson_id)
        db.run(
          'INSERT INTO schedules (school_id, scheduled_date, scheduled_time, duration_minutes, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [school_id, scheduled_date, scheduled_time, duration_minutes, status || 'scheduled', notes],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            const scheduleId = this.lastID;
            let operationsCompleted = 0;
            let totalOperations = 0;
            let hasError = false;
            
            // Count total operations needed
            if (lesson_ids && lesson_ids.length > 0) totalOperations += lesson_ids.length;
            if (teacher_ids && teacher_ids.length > 0) totalOperations += teacher_ids.length;
            
            if (totalOperations === 0) {
              db.run('COMMIT');
              resolve({ id: scheduleId, ...schedule });
              return;
            }
            
            const checkCompletion = () => {
              operationsCompleted++;
              if (operationsCompleted === totalOperations && !hasError) {
                db.run('COMMIT');
                resolve({ id: scheduleId, ...schedule });
              }
            };
            
            // Insert schedule-lesson relationships
            if (lesson_ids && lesson_ids.length > 0) {
              const lessonStmt = db.prepare('INSERT INTO schedule_lessons (schedule_id, lesson_id) VALUES (?, ?)');
              
              lesson_ids.forEach(lessonId => {
                lessonStmt.run([scheduleId, lessonId], function(err) {
                  if (err && !hasError) {
                    hasError = true;
                    lessonStmt.finalize();
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }
                  checkCompletion();
                });
              });
              
              lessonStmt.finalize();
            }
            
            // Insert schedule-teacher relationships
            if (teacher_ids && teacher_ids.length > 0) {
              const teacherStmt = db.prepare('INSERT INTO schedule_teachers (schedule_id, teacher_id) VALUES (?, ?)');
              
              teacher_ids.forEach(teacherId => {
                teacherStmt.run([scheduleId, teacherId], function(err) {
                  if (err && !hasError) {
                    hasError = true;
                    teacherStmt.finalize();
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }
                  checkCompletion();
                });
              });
              
              teacherStmt.finalize();
            }
          }
        );
      });
    });
  }

  updateSchedule(id, schedule) {
    return new Promise((resolve, reject) => {
      const { lesson_ids, school_id, teacher_ids, scheduled_date, scheduled_time, duration_minutes, status, notes } = schedule;
      const db = this.db; // Store reference to avoid context issues
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Update schedule (without lesson_id)
        db.run(
          'UPDATE schedules SET school_id = ?, scheduled_date = ?, scheduled_time = ?, duration_minutes = ?, status = ?, notes = ? WHERE id = ?',
          [school_id, scheduled_date, scheduled_time, duration_minutes, status, notes, id],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            // Delete existing relationships
            db.run('DELETE FROM schedule_lessons WHERE schedule_id = ?', [id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              db.run('DELETE FROM schedule_teachers WHERE schedule_id = ?', [id], function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }
                
                let operationsCompleted = 0;
                let totalOperations = 0;
                let hasError = false;
                
                // Count total operations needed
                if (lesson_ids && lesson_ids.length > 0) totalOperations += lesson_ids.length;
                if (teacher_ids && teacher_ids.length > 0) totalOperations += teacher_ids.length;
                
                if (totalOperations === 0) {
                  db.run('COMMIT');
                  resolve({ id, ...schedule });
                  return;
                }
                
                const checkCompletion = () => {
                  operationsCompleted++;
                  if (operationsCompleted === totalOperations && !hasError) {
                    db.run('COMMIT');
                    resolve({ id, ...schedule });
                  }
                };
                
                // Insert new schedule-lesson relationships
                if (lesson_ids && lesson_ids.length > 0) {
                  const lessonStmt = db.prepare('INSERT INTO schedule_lessons (schedule_id, lesson_id) VALUES (?, ?)');
                  
                  lesson_ids.forEach(lessonId => {
                    lessonStmt.run([id, lessonId], function(err) {
                      if (err && !hasError) {
                        hasError = true;
                        lessonStmt.finalize();
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                      }
                      checkCompletion();
                    });
                  });
                  
                  lessonStmt.finalize();
                }
                
                // Insert new schedule-teacher relationships
                if (teacher_ids && teacher_ids.length > 0) {
                  const teacherStmt = db.prepare('INSERT INTO schedule_teachers (schedule_id, teacher_id) VALUES (?, ?)');
                  
                  teacher_ids.forEach(teacherId => {
                    teacherStmt.run([id, teacherId], function(err) {
                      if (err && !hasError) {
                        hasError = true;
                        teacherStmt.finalize();
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                      }
                      checkCompletion();
                    });
                  });
                  
                  teacherStmt.finalize();
                }
              });
            });
          }
        );
      });
    });
  }

  deleteSchedule(id) {
    return new Promise((resolve, reject) => {
      const db = this.db; // Store reference to avoid context issues
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete schedule-lesson relationships
        db.run('DELETE FROM schedule_lessons WHERE schedule_id = ?', [id], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          // Delete schedule-teacher relationships
          db.run('DELETE FROM schedule_teachers WHERE schedule_id = ?', [id], function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            // Delete schedule
            db.run('DELETE FROM schedules WHERE id = ?', [id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
              } else {
                db.run('COMMIT');
                resolve({ deleted: this.changes > 0 });
              }
            });
          });
        });
      });
    });
  }

  // Student Attendance operations
  getStudentAttendance(scheduleId = null, studentId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT sa.*, s.name as student_name, s.grade, sch.scheduled_date, sch.scheduled_time, 
               sch.status as schedule_status, school.name as school_name,
               GROUP_CONCAT(DISTINCT l.title) as lesson_titles
        FROM student_attendance sa
        LEFT JOIN students s ON sa.student_id = s.id
        LEFT JOIN schedules sch ON sa.schedule_id = sch.id
        LEFT JOIN schools school ON sch.school_id = school.id
        LEFT JOIN schedule_lessons sl ON sch.id = sl.schedule_id
        LEFT JOIN lessons l ON sl.lesson_id = l.id
      `;
      
      const conditions = [];
      const params = [];
      
      if (scheduleId) {
        conditions.push('sa.schedule_id = ?');
        params.push(scheduleId);
      }
      
      if (studentId) {
        conditions.push('sa.student_id = ?');
        params.push(studentId);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY sa.id ORDER BY sch.scheduled_date DESC, sch.scheduled_time DESC';
      
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  addStudentAttendance(attendance) {
    return new Promise((resolve, reject) => {
      const { schedule_id, student_id, attendance_status, knowledge_score, participation_score, notes } = attendance;
      this.db.run(
        `INSERT INTO student_attendance 
         (schedule_id, student_id, attendance_status, knowledge_score, participation_score, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [schedule_id, student_id, attendance_status, knowledge_score, participation_score, notes],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  updateStudentAttendance(id, attendance) {
    return new Promise((resolve, reject) => {
      const { attendance_status, knowledge_score, participation_score, notes } = attendance;
      this.db.run(
        `UPDATE student_attendance 
         SET attendance_status = ?, knowledge_score = ?, participation_score = ?, notes = ?, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [attendance_status, knowledge_score, participation_score, notes, id],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes > 0 });
        }
      );
    });
  }

  deleteStudentAttendance(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM student_attendance WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  // Get students for a specific schedule (to manage attendance)
  getStudentsForSchedule(scheduleId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT s.*, sa.id as attendance_id, sa.attendance_status, sa.knowledge_score, 
               sa.participation_score, sa.notes as attendance_notes
        FROM students s
        LEFT JOIN schedules sch ON s.school_id = sch.school_id
        LEFT JOIN student_attendance sa ON s.id = sa.student_id AND sa.schedule_id = ?
        WHERE sch.id = ?
        ORDER BY s.name
      `;
      
      this.db.all(query, [scheduleId, scheduleId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Database;
