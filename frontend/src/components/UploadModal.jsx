import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'

const MODAL_OVERLAY = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
}

const MODAL_BOX = {
  background: 'var(--surface)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--radius-lg)',
  padding: '2rem',
  width: '100%',
  maxWidth: '420px',
  direction: 'rtl',
  fontFamily: 'var(--font)',
}

const INPUT_STYLE = {
  fontFamily: 'var(--font)',
  fontSize: '14px',
  background: 'var(--surface-2)',
  color: 'var(--text-1)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--radius)',
  padding: '9px 14px',
  width: '100%',
  outline: 'none',
  direction: 'rtl',
}

const BTN_PRIMARY = {
  fontFamily: 'var(--font)',
  fontSize: '15px',
  fontWeight: '600',
  background: 'var(--accent)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius)',
  padding: '10px 24px',
  cursor: 'pointer',
  width: '100%',
}

const BTN_SECONDARY = {
  fontFamily: 'var(--font)',
  fontSize: '14px',
  background: 'var(--surface-2)',
  color: 'var(--text-2)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--radius)',
  padding: '9px 20px',
  cursor: 'pointer',
}

const LABEL_STYLE = {
  fontSize: '13px',
  color: 'var(--text-2)',
  marginBottom: '6px',
  display: 'block',
}

export default function UploadModal({ onClose }) {
  const navigate = useNavigate()
  const fileRef = useRef()

  // Companies from backend
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [addingCompany, setAddingCompany] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')

  // Form state
  const [reportType, setReportType] = useState('Annual')
  const [file, setFile] = useState(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // null | 'success' | 'duplicate' | 'error'
  const [resultData, setResultData] = useState(null)
  const [duplicateFile, setDuplicateFile] = useState(null)

  useEffect(() => {
    fetch(`${API}/documents`)
      .then(r => r.json())
      .then(data => {
        const names = Object.keys(data)
        setCompanies(names)
        if (names.length > 0) setSelectedCompany(names[0])
      })
  }, [])

  const companyToSubmit = addingCompany ? newCompanyName.trim() : selectedCompany

  async function handleExtract(overwrite = false) {
    if (!companyToSubmit) return
    if (!file) return

    setLoading(true)
    setStatus(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('company', companyToSubmit)
    formData.append('report_type', reportType)

    const endpoint = overwrite ? `${API}/extract/confirm-overwrite` : `${API}/extract`

    try {
      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json()

      if (data.status === 'duplicate') {
        setStatus('duplicate')
        setResultData(data)
        setDuplicateFile(file)
      } else if (data.status === 'success' || data.status === 'overwritten') {
        setStatus('success')
        setResultData(data)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div style={MODAL_OVERLAY}>
        <div style={MODAL_BOX}>
          <div style={{ textAlign: 'center', padding: '0.1rem 0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '550', color: 'var(--positive)', marginBottom: '1.0rem' }}>
              تم استخلاص البيانات بنجاح
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-2)', marginBottom: '1.5rem' }}>
              {resultData?.company} — {resultData?.period}
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                style={{ ...BTN_SECONDARY, width: 'auto', fontSize: '15px', fontWeight: '500' }}
                onClick={onClose}
              >
                إغلاق
              </button>
              <button
                style={{ ...BTN_PRIMARY, width: 'auto', fontSize: '15px', fontWeight: '500' }}
                onClick={() => {
                  onClose()
                  navigate('/dashboard', { state: { company: resultData?.company } })
                }}
              >
                عرض لوحة المعلومات
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Duplicate confirmation state ───────────────────────────────────────
  if (status === 'duplicate') {
    return (
      <div style={MODAL_OVERLAY}>
        <div style={MODAL_BOX}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '12px' }}>
            تنبيه
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            يوجد تقرير لـ <strong style={{ color: 'var(--text-1)' }}>{resultData?.period}</strong> مسجّل مسبقًا لهذه الشركة.
            هل تريد استبداله؟
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={BTN_SECONDARY} onClick={() => setStatus(null)}>
              إلغاء
            </button>
            <button
              style={{ ...BTN_PRIMARY, background: 'var(--negative)' }}
              onClick={() => handleExtract(true)}
              disabled={loading}
            >
              {loading ? 'جارٍ الاستبدال...' : 'استبدال'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main upload form ───────────────────────────────────────────────────
  return (
    <div style={MODAL_OVERLAY} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={MODAL_BOX}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-1)' }}>
            رفع تقرير مالي
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Company selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={LABEL_STYLE}>الشركة</label>
          {!addingCompany ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                style={{ ...INPUT_STYLE, flex: 1 }}
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
              >
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                style={{ ...BTN_SECONDARY, whiteSpace: 'nowrap' }}
                onClick={() => setAddingCompany(true)}
              >
                إضافة شركة
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ ...INPUT_STYLE, flex: 1 }}
                placeholder="اسم الشركة"
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                autoFocus
              />
              <button
                style={BTN_SECONDARY}
                onClick={() => { setAddingCompany(false); setNewCompanyName('') }}
              >
                إلغاء
              </button>
            </div>
          )}
        </div>

        {/* Report type */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={LABEL_STYLE}>نوع التقرير</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Annual', 'Quarterly'].map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                style={{
                  fontFamily: 'var(--font)',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: reportType === type ? 'var(--accent)' : 'var(--surface-2)',
                  color: reportType === type ? 'white' : 'var(--text-2)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 'var(--radius)',
                  padding: '8px 20px',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                {type === 'Annual' ? 'سنوي' : 'ربعي'}
              </button>
            ))}
          </div>
        </div>

        {/* File upload */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={LABEL_STYLE}>ملف PDF</label>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: `1px dashed ${file ? 'var(--accent)' : 'var(--border-2)'}`,
              borderRadius: 'var(--radius)',
              padding: '2.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: file ? 'var(--accent-glow)' : 'var(--surface-2)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <p style={{ fontSize: '14px', color: file ? 'var(--accent)' : 'var(--text-2)', margin: 0 }}>
              {file ? file.name : 'اضغط لاختيار ملف PDF'}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])}
          />
        </div>

        {/* Error message */}
        {status === 'error' && (
          <p style={{ fontSize: '13px', color: 'var(--negative)', marginBottom: '1rem', textAlign: 'center' }}>
            حدث خطأ أثناء الاستخلاص. يرجى المحاولة مرة أخرى.
          </p>
        )}

        {/* Submit button */}
        <button
          style={{
            ...BTN_PRIMARY,
            opacity: loading || !file || !companyToSubmit ? 0.6 : 1,
            cursor: loading || !file || !companyToSubmit ? 'not-allowed' : 'pointer',
          }}
          onClick={() => handleExtract(false)}
          disabled={loading || !file || !companyToSubmit}
        >
          {loading ? 'جارٍ الاستخلاص...' : 'استخلاص البيانات'}
        </button>

      </div>
    </div>
  )
}
