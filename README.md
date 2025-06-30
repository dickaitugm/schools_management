# School Management System

A comprehensive desktop application for managing schools, teachers, and students built with Electron, React, TailwindCSS, and SQLite.

## Features

- **School Management**: Create, read, update, and delete school records
- **Teacher Management**: Manage teacher profiles with school assignments
- **Student Management**: Handle student records and enrollment
- **Lesson Management**: Create and manage lesson content that can be taught at multiple schools
- **Schedule Management**: Plan and track when lessons are taught at different schools
- **Calendar View**: Visual calendar showing all scheduled visits and lessons
- **Profile Pages**: Detailed view with relational data for each entity
  - School Profile: Shows all teachers and students in that school
  - Teacher Profile: Shows school info and fellow students
  - Student Profile: Shows school info, teachers, and classmates
  - Lesson Profile: Shows schedule history and statistics
- **Dashboard**: Overview of system statistics including upcoming schedules
- **SQLite Database**: Local database storage for all data
- **Modern UI**: Built with TailwindCSS for a clean, responsive interface

## Technology Stack

- **Frontend**: React 18 with React Router
- **Desktop Framework**: Electron
- **Styling**: TailwindCSS
- **Database**: SQLite3
- **Build Tools**: React Scripts, Concurrently

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## Installation

1. Clone or download the project
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Option 1: Using npm scripts (Recommended)
```bash
# Development mode (starts both React and Electron)
npm run dev
```

### Option 2: Manual startup
1. Start React development server:
   ```bash
   npm start
   ```
2. In a new terminal, start Electron:
   ```bash
   npm run electron-dev
   ```

### Option 3: Using the development script
```bash
node dev-start.js
```

### Option 4: Windows Batch File
```bash
start.bat
```

## Building for Production

```bash
# Build React app
npm run build

# Build Electron app
npm run electron-build
```

## Application Structure

```
src/
├── components/
│   ├── Dashboard.js          # Main dashboard with statistics
│   ├── SchoolManagement.js   # School CRUD operations
│   ├── TeacherManagement.js  # Teacher CRUD operations
│   ├── StudentManagement.js  # Student CRUD operations
│   ├── LessonManagement.js   # Lesson CRUD operations
│   ├── ScheduleManagement.js # Schedule CRUD operations
│   ├── CalendarView.js       # Calendar view for schedules
│   ├── SchoolProfile.js      # Detailed school profile with relations
│   ├── TeacherProfile.js     # Detailed teacher profile with relations
│   ├── StudentProfile.js     # Detailed student profile with relations
│   ├── LessonProfile.js      # Detailed lesson profile with schedule history
│   ├── Sidebar.js           # Navigation sidebar
│   └── Modal.js             # Reusable modal component
├── App.js                   # Main application component
├── index.js                 # Application entry point
└── index.css               # Global styles with Tailwind

public/
├── electron.js             # Electron main process
├── database.js             # SQLite database operations
├── preload.js             # Electron preload script
└── index.html             # HTML template
```

## Database Schema

### Schools Table
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `address` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `created_at` (DATETIME)

### Teachers Table
- `id` (INTEGER PRIMARY KEY)
- `school_id` (INTEGER, Foreign Key)
- `name` (TEXT NOT NULL)
- `subject` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `hire_date` (DATE)
- `created_at` (DATETIME)

### Students Table
- `id` (INTEGER PRIMARY KEY)
- `school_id` (INTEGER, Foreign Key)
- `name` (TEXT NOT NULL)
- `grade` (TEXT)
- `age` (INTEGER)
- `phone` (TEXT)
- `email` (TEXT)
- `enrollment_date` (DATE)
- `created_at` (DATETIME)

### Lessons Table
- `id` (INTEGER PRIMARY KEY)
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `duration_minutes` (INTEGER DEFAULT 60)
- `materials` (TEXT)
- `target_grade` (TEXT)
- `created_at` (DATETIME)

### Schedules Table
- `id` (INTEGER PRIMARY KEY)
- `lesson_id` (INTEGER, Foreign Key)
- `school_id` (INTEGER, Foreign Key)
- `teacher_id` (INTEGER, Foreign Key)
- `scheduled_date` (DATE NOT NULL)
- `scheduled_time` (TIME NOT NULL)
- `duration_minutes` (INTEGER DEFAULT 60)
- `status` (TEXT DEFAULT 'scheduled')
- `notes` (TEXT)
- `created_at` (DATETIME)

## Usage

1. **Dashboard**: View overview statistics of schools, teachers, and students
2. **Schools**: Add, edit, delete, and select schools
3. **Teachers**: Manage teacher records, assign to schools
4. **Students**: Manage student enrollment and information

## Features

- **CRUD Operations**: Full Create, Read, Update, Delete functionality for all entities
- **Relational Data**: Teachers and students are linked to schools
- **Filtering**: View teachers and students by selected schools
- **Form Validation**: Required fields and data validation
- **Responsive Design**: Works well on different screen sizes
- **Local Storage**: SQLite database stored locally

## Troubleshooting

### PowerShell Execution Policy Error
If you encounter PowerShell execution policy errors:
1. Use `npm.cmd` instead of `npm`
2. Or run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Node Modules Issues
If dependencies are missing:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Issues
The SQLite database is automatically created in the Electron app data directory. If you need to reset it, delete the `school_management.db` file from:
- Windows: `%APPDATA%/school-management-app/`
- macOS: `~/Library/Application Support/school-management-app/`
- Linux: `~/.config/school-management-app/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the application
5. Submit a pull request

## License

This project is licensed under the MIT License.
