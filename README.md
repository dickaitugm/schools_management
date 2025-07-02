# BB Society Information System (Next.js Web Version)

A comprehensive web application for managing schools, teachers, and students built with Next.js, React, TailwindCSS, and PostgreSQL.

## Features

- **School Management**: Create, read, update, and delete school records
- **Teacher Management**: Manage teacher profiles with school assignments (Coming Soon)
- **Student Management**: Handle student records and enrollment (Coming Soon)
- **Lesson Management**: Create and manage lesson content (Coming Soon)
- **Schedule Management**: Plan and track when lessons are taught (Coming Soon)
- **Dashboard**: Overview of system statistics
- **Modern UI**: Built with TailwindCSS for a clean, responsive interface
- **PostgreSQL Database**: Production-ready database storage
- **API Routes**: RESTful API built with Next.js

## Technology Stack

- **Frontend**: Next.js 14 with React 18
- **Styling**: TailwindCSS
- **Database**: PostgreSQL
- **ORM**: Raw SQL queries with pg (PostgreSQL client)
- **API**: Next.js API Routes

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. Clone or download the project
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up PostgreSQL database:
   ```bash
   # Create a new PostgreSQL database
   createdb bb_society_db
   ```

5. Configure environment variables:
   ```bash
   # Copy and edit the environment file
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your database credentials:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/bb_society_db
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

6. Run database migrations:
   ```bash
   npm run db:migrate
   ```

7. (Optional) Seed the database with sample data:
   ```bash
   npm run db:seed
   ```

## Running the Application

### Development mode
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build
```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── api/           # API routes
│   │   └── schools/   # Schools API endpoints
│   ├── globals.css    # Global styles
│   ├── layout.js      # Root layout
│   └── page.js        # Home page
├── components/        # React components
│   ├── Dashboard.js
│   ├── SchoolManagement.js
│   ├── TeacherManagement.js
│   ├── StudentManagement.js
│   ├── LessonManagement.js
│   ├── ScheduleManagement.js
│   ├── Sidebar.js
│   └── Modal.js
├── lib/
│   └── db.js         # Database connection
├── scripts/
│   ├── migrate.js    # Database schema migration
│   └── seed.js       # Sample data seeding
└── public/           # Static files
```

## Database Schema

### Schools Table
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR NOT NULL)
- `address` (TEXT)
- `phone` (VARCHAR)
- `email` (VARCHAR)
- `created_at` (TIMESTAMP)

### Teachers Table
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR NOT NULL)
- `subject` (VARCHAR)
- `phone` (VARCHAR)
- `email` (VARCHAR)
- `hire_date` (DATE)
- `created_at` (TIMESTAMP)

### Teacher-Schools Relationship
- `teacher_schools` table for many-to-many relationship

### Students Table
- `id` (SERIAL PRIMARY KEY)
- `school_id` (INTEGER, Foreign Key)
- `name` (VARCHAR NOT NULL)
- `grade` (VARCHAR)
- `age` (INTEGER)
- `phone` (VARCHAR)
- `email` (VARCHAR)
- `enrollment_date` (DATE)
- `created_at` (TIMESTAMP)

### Other tables for Lessons, Schedules, and Attendance...

## API Endpoints

### Schools
- `GET /api/schools` - Get all schools
- `POST /api/schools` - Create new school
- `GET /api/schools/[id]` - Get single school
- `PUT /api/schools/[id]` - Update school
- `DELETE /api/schools/[id]` - Delete school

### Other endpoints (Coming Soon)
- Teachers: `/api/teachers`
- Students: `/api/students`
- Lessons: `/api/lessons`
- Schedules: `/api/schedules`

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Traditional Hosting
1. Build the application: `npm run build`
2. Upload the entire project to your server
3. Install dependencies: `npm install --production`
4. Set up PostgreSQL database
5. Configure environment variables
6. Run migrations: `npm run db:migrate`
7. Start the application: `npm start`

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/bb_society_db

# Authentication (for future use)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# For production
NODE_ENV=production
```

## Current Status

✅ **Completed:**
- Next.js project structure
- PostgreSQL database setup
- Schools management (full CRUD)
- Dashboard with basic statistics
- Responsive UI with TailwindCSS

🚧 **In Progress:**
- Teachers management API and UI
- Students management API and UI
- Lessons management API and UI
- Schedules management API and UI
- Advanced dashboard analytics

## Development Notes

This project was migrated from an Electron desktop application to a Next.js web application. The core functionality remains the same, but now runs in the browser with a PostgreSQL backend instead of SQLite.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the application
5. Submit a pull request

## License

This project is licensed under the MIT License.

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
