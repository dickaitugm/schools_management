# Overlapping Bar Chart Implementation

## Overview

Implemented an overlapping bar chart in the Dashboard component to visualize student assessment progress by school. The chart shows both total students in each school (background bars) and assessed students per schedule (foreground bars).

## Chart Features

### Visual Design

-   **Background Bars**: Show total students in each school with low opacity (0.2)
-   **Foreground Bars**: Show assessed students per schedule with higher opacity (0.8)
-   **Color Coding**: Each school has a unique color for easy identification
-   **Overlapping Effect**: Bars are rendered on top of each other to show progress

### Data Structure

The chart data is prepared by grouping schedules by date and school:

```javascript
{
  date: "DD/MM/YYYY",
  total_[SchoolName]: totalStudentsInSchool,
  [SchoolName]: assessedStudentsInSchedule
}
```

### School Color Mapping

-   SD Harapan Bangsa: Blue (#3B82F6)
-   SMP Tunas Muda: Green (#10B981)
-   SMA Cerdas Berkarya: Yellow/Orange (#F59E0B)
-   Rusunawa Cibuluh: Red (#EF4444)

## Implementation Details

### Component Updates

-   **File**: `components/Dashboard.js`
-   **Function**: `prepareScheduleOverlappingData()`
-   **Chart Library**: Recharts BarChart component

### Key Changes Made

1. Renamed function from `prepareScheduleStackedData` to `prepareScheduleOverlappingData`
2. Updated chart title to "Students Assessment Progress by School"
3. Removed `stackId` property from Bar components to enable overlapping
4. Adjusted `fillOpacity` values (0.2 for background, 0.8 for foreground)
5. Added rounded corners to all bars with `radius={[2, 2, 2, 2]}`

### Bar Rendering Order

1. **Background bars** are rendered first (total students per school)
2. **Foreground bars** are rendered second (assessed students per schedule)
3. This ensures assessed students appear on top of total students

### Tooltip and Legend

-   **Tooltip**: Shows both total and assessed student counts
-   **Legend**: Distinguishes between "Total in [School]" and "Assessed in [School]"
-   **Formatting**: Clear labels with school names

## Benefits

1. **Visual Clarity**: Easy to see assessment progress vs total capacity
2. **Comparison**: Compare performance across different schools
3. **Trends**: Track assessment completion over time
4. **Color Coding**: Quick identification of each school's data

## Usage

The chart automatically loads data from the dashboard API and displays:

-   X-axis: Schedule dates
-   Y-axis: Number of students
-   Background bars: Total students enrolled in each school
-   Foreground bars: Students who completed assessments (present + all categories filled)

## Data Source

The chart uses data from `/api/dashboard` endpoint which includes:

-   Schedule data with student counts
-   Total school student counts
-   Assessment completion logic (attendance = 'present' + all assessment categories filled)
