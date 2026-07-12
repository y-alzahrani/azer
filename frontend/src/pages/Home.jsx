import { useState } from 'react'
import UploadModal from '../components/UploadModal'

export default function Home() {
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div style={{
      minHeight: 'calc(80vh - 56px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      direction: 'rtl',
      fontFamily: 'var(--font)',
      textAlign: 'center',
    }}>

      {/* Hero */}
      <h1 style={{
        fontSize: '80px',
        fontWeight: '700',
        color: 'var(--text-1)',
        lineHeight: 2,
        marginBottom: '0.7rem',
      }}>
        آزِر
      </h1>

      <p style={{
        fontSize: '15px',
        color: 'var(--accent)',
        letterSpacing: '0.25em',
        marginBottom: '1.1rem',
      }}>
        EQUITY INTELLIGENCE
      </p>

      <p style={{
        fontSize: '17px',
        color: 'var(--text-1)',
        maxWidth: '560px',
        lineHeight: 1.5,
        marginBottom: '1.1rem',
      }}>
        منصة تحليل مالي للشركات مدعومة بالذكاء الاصطناعي
      </p>

      <p style={{
        fontSize: '15px',
        color: 'var(--text-3)',
        maxWidth: '600px',
        fontWeight: '400',
        lineHeight: 1.5,
        marginBottom: '3.5rem'
      }}>
        ارفع تقاريرك المالية واحصل على تحليلات وملخصات تساعدك في قراراتك الاستثمارية
      </p>


      <button
        onClick={() => setShowUpload(true)}
        style={{
          fontFamily: 'var(--font)',
          fontSize: '15px',
          fontWeight: '500',
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius)',
          padding: '8px 18px',
          cursor: 'pointer',
        }}
      >
        رفع تقرير
      </button>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

    </div>
  )
}
