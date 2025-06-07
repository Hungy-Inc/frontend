import Link from 'next/link'

export default function Header() {
  return (
    <header>
      <div className="container">
        <div className="navbar">
          <div className="logo">
            <h1>
              Hungy<span className="relative">
                <span className="absolute w-1 h-1 bg-[#f24503] rounded-full top-0 left-0.5"></span>
                <span className="absolute w-1 h-1 bg-[#f24503] rounded-full top-0 left-2"></span>
              </span>
            </h1>
          </div>

          <nav className="nav-links">
            <Link href="/dashboard" className="active">Dashboard</Link>
            <Link href="/analytics">Analytics</Link>
            <Link href="/reports">Reports</Link>
          </nav>

          <div className="user-dropdown">
            <div className="avatar">A</div>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </header>
  )
} 