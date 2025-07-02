import './globals.css'

export const metadata = {
  title: 'BB Society Information System',
  description: 'Comprehensive management system for BB Society schools, teachers, and students',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
