export default function SectionHeader({ title }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '1.25rem',
    }}>
      <span style={{
        width: '3px',
        height: '20px',
        background: 'var(--accent)',
        borderRadius: '2px',
        flexShrink: 0,
      }} />
      <h2 style={{
        fontSize: '20px',
        fontWeight: '550',
        color: 'var(--text-1)',
      }}>
        {title}
      </h2>
    </div>
  )
}
