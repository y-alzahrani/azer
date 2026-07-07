import { NavLink } from 'react-router-dom'

const links = [
  { to: '/documents', label: 'مستنداتي'          },
  { to: '/dcf',       label: 'تقييم سعر السهم'   },
  { to: '/chat',      label: 'المساعد الذكي'      },
  { to: '/dashboard', label: 'لوحة المعلومات'     },
  { to: '/',          label: 'الرئيسية', end: true },
]

export default function Navbar() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(17,17,17,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>

      {/* Logo — right side (RTL) */}
      <div style={{
        fontFamily: 'var(--font)',
        fontSize: '22px',
        fontWeight: '700',
        letterSpacing: '0.05em',
        color: 'var(--text-1)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        
        AZER
        <span style={{ color: 'var(--accent)', fontSize: '15px', marginBottom: '0px' }}>✦</span>
      </div>

      {/* Nav links — left side (RTL) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              fontFamily: 'var(--font)',
              fontSize: '15px',
              fontWeight: isActive ? '700' : '500',
              color: isActive ? 'var(--accent)' : 'var(--text-1)',
              textDecoration: 'none',
              paddingBottom: '3px',
              borderBottom: isActive ? '1px solid var(--accent)' : '2px solid transparent',
              transition: 'color 0.2s, border-color 0.2s',
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>

    </nav>
  )
}