export default function SummaryCard({ label, value, sub, trend }) {
  // trend: 'up' | 'down' | null
  const trendColor = trend === 'up' ? 'var(--positive)' : trend === 'down' ? 'var(--negative)' : 'var(--text-2)'

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1.1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-dim)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <span style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: '400' }}>
        {label}
      </span>
      <span style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-1)', lineHeight: 1.0 }}>
        {value ?? '—'}
      </span>
      {sub && (
        <span style={{ fontSize: '12px', color: trendColor }}>
          {sub}
        </span>
      )}
    </div>
  )
}
