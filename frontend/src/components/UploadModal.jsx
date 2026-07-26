import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import COMPANIES from '../companies.json'

const API = 'http://localhost:8000'


const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021']
const PERIODS = [
  { value: 'Annual', label: 'سنوي' },
  { value: 'Q1', label: 'الربع الأول' },
  { value: 'Q2', label: 'الربع الثاني' },
  { value: 'Q3', label: 'الربع الثالث' },
  { value: 'Q4', label: 'الربع الرابع' },
]

// ── Styles ────────────────────────────────────────────────────────────────────

const OVERLAY = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, backdropFilter: 'blur(4px)',
}

const BOX = {
  background: 'var(--surface)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--radius-lg)',
  padding: '2rem',
  width: '100%', maxWidth: '440px',
  direction: 'rtl', fontFamily: 'var(--font)',
  maxHeight: '90vh', overflowY: 'auto',
}

const RESULT_BOX = {
  background: 'var(--surface)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--radius-lg)',
  padding: '2rem',
  width: '100%', maxWidth: '480px',
  direction: 'rtl', fontFamily: 'var(--font)',
}

const LABEL = {
  fontSize: '13px', color: 'var(--text-2)',
  marginBottom: '6px', display: 'block',
}

const INPUT = {
  fontFamily: 'var(--font)', fontSize: '14px',
  background: 'var(--surface-2)', color: 'var(--text-1)',
  border: '1px solid var(--border-2)', borderRadius: 'var(--radius)',
  padding: '9px 14px', width: '100%', outline: 'none', direction: 'rtl',
}

const BTN = {
  fontFamily: 'var(--font)', fontSize: '15px', fontWeight: '600',
  background: 'var(--accent)', color: 'white',
  border: 'none', borderRadius: 'var(--radius)',
  padding: '10px 24px', cursor: 'pointer', width: '100%',
}

const BTN2 = {
  fontFamily: 'var(--font)', fontSize: '14px',
  background: 'var(--surface-2)', color: 'var(--text-2)',
  border: '1px solid var(--border-2)', borderRadius: 'var(--radius)',
  padding: '9px 20px', cursor: 'pointer',
}

const SELECT = {
  ...INPUT,
  appearance: 'none', cursor: 'pointer',
}

// ── Result Modal ──────────────────────────────────────────────────────────────

function ResultModal({ status, agentResult, loading, onConfirm, onClose }) {
  const isFound = status === 'found'

  return (
    <div style={{ ...OVERLAY, zIndex: 1100 }}>
      <div style={RESULT_BOX}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.0rem' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', color: isFound ? 'var(--positive)' : 'var(--negative)', marginBottom: '0.0rem' }}>
            {isFound ? '✓ تم العثور على التقرير' : '✗ تعذّر الحصول على التقرير'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {isFound && agentResult ? (
          <>
            {/* Report name */}
            {agentResult.report_name && (
              <p style={{ fontSize: '15px', color: 'var(--text-1)', marginBottom: '1.25rem', marginTop: '1.25rem', fontWeight: '600' }}>
                {agentResult.report_name}
              </p>
            )}

            {/* IR page link */}
            {agentResult.reports_page_url && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-1)' }}>رابط صفحة التقارير: </span>
                <a
                  href={agentResult.reports_page_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '13px', color: 'var(--accent)', wordBreak: 'break-all' }}
                >
                  {agentResult.reports_page_url}
                </a>
              </div>
            )}

            {/* PDF link */}
            {agentResult.pdf_url && (
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-1)' }}>رابط التقرير: </span>
                <a
                  href={agentResult.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '13px', color: 'var(--accent)', wordBreak: 'break-all', }}
                >
                  {agentResult.pdf_url}
                </a>
              </div>
            )}

            {/* Verify nudge */}
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '1.25rem' }}>
              يرجى التحقق من الروابط أعلاه قبل المتابعة
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ ...BTN2, flex: 1 }} onClick={onClose}>
                إغلاق
              </button>
              <button
                style={{ ...BTN, flex: 2, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? 'جارٍ الاستخلاص...' : 'تأكيد واستخلاص البيانات'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Not found message */}
            <p style={{ fontSize: '15px', color: 'var(--text-1)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
              يرجى تحميل التقرير ورفعه يدويًا
            </p>

            {/* IR page link if available */}
            {agentResult?.reports_page_url && (
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-1)' }}>رابط صفحة التقارير: </span>
                <a
                  href={agentResult.reports_page_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '13px', color: 'var(--accent)', wordBreak: 'break-all' }}
                >
                  {agentResult.reports_page_url}
                </a>
              </div>
            )}

            {/* Close button */}
            <button style={{ ...BTN2, width: '30%' }} onClick={onClose}>
              إغلاق
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UploadModal({ onClose }) {
  const navigate = useNavigate()
  const fileRef = useRef()
  const inputRef = useRef()

  // Company autocomplete
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Period
  const [year, setYear] = useState('2025')
  const [period, setPeriod] = useState('Annual')

  // Manual upload
  const [file, setFile] = useState(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [agentResult, setAgentResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [searching, setSearching] = useState(false)
  const [extractionSource, setExtractionSource] = useState(null)

  // Existing documents for duplicate pre-check
  const [existingDocs, setExistingDocs] = useState({})

  useEffect(() => {
    fetch(`${API}/documents`)
      .then(r => r.json())
      .then(data => setExistingDocs(data))
      .catch(() => {})
  }, [])

  // Autocomplete filtering
  function normalizeArabic(str) {
  return str
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
  }

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const q = query.toLowerCase()
    const matches = COMPANIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      normalizeArabic(c.name_ar).includes(normalizeArabic(query)) ||
      c.ticker.toLowerCase().includes(q)
    )
    setSuggestions(matches)
    setShowDropdown(true)
  }, [query])

  const companyName = selectedCompany?.name || query.trim()
  const periodLabel = period === 'Annual' ? `FY ${year}` : `${period} ${year}`
  const canFindReport = !!companyName && !!year && !!period
  const canExtract = !!file && !!companyName

  // Duplicate pre-check
  const isDuplicate = (() => {
    if (!companyName) return false
    const companyDocs = existingDocs[companyName]
    if (!companyDocs) return false
    return companyDocs.reports.some(r => r.period === periodLabel)
  })()

  // ── Find Report ───────────────────────────────────────────────────────────
  async function handleFindReport() {
    if (!canFindReport) return
    setSearching(true)
    setStatus(null)
    setAgentResult(null)

    try {
      const res = await fetch(`${API}/find-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyName, period: periodLabel }),
      })
      const data = await res.json()
      setAgentResult(data)
      setStatus(data.pdf_url ? 'found' : 'not_found')
      setShowResultModal(true)
    } catch {
      setAgentResult(null)
      setStatus('not_found')
      setShowResultModal(true)
    } finally {
      setSearching(false)
    }
  }

  // ── Confirm agent result → extract ────────────────────────────────────────
  async function handleConfirmAndExtract(overwrite = false) {
    if (!agentResult?.pdf_url) return
    setLoading(true)
    setExtractionSource('url')

    try {
      const res = await fetch(overwrite ? `${API}/extract-from-url/confirm-overwrite` : `${API}/extract-from-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_url: agentResult.pdf_url,
          company: companyName,
          report_type: period === 'Annual' ? 'Annual' : 'Quarterly',
        }),
      })
      const data = await res.json()
      setShowResultModal(false)
      handleExtractResponse(data)
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // ── Manual upload → extract ───────────────────────────────────────────────
  async function handleManualExtract(overwrite = false) {
    if (!file || !companyName) return
    setLoading(true)
    setExtractionSource('file')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('company', companyName)
    formData.append('report_type', period === 'Annual' ? 'Annual' : 'Quarterly')

    const endpoint = overwrite ? `${API}/extract/confirm-overwrite` : `${API}/extract`

    try {
      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json()
      handleExtractResponse(data)
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  function handleExtractResponse(data) {
    if (data.status === 'duplicate') {
      setStatus('duplicate')
      setAgentResult(data)
    } else if (data.status === 'success' || data.status === 'overwritten') {
      setStatus('success')
      setAgentResult(data)
    } else {
      setStatus('error')
    }
  }
  

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div style={OVERLAY}>
        <div style={BOX}>
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--positive)', marginBottom: '1rem' }}>
              تم استخلاص البيانات بنجاح
            </h2>
            <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-1)', marginBottom: '1.5rem' }}>
              {agentResult?.company} — {agentResult?.period}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={{ ...BTN2, width: 'auto' }} onClick={onClose}>إغلاق</button>
              <button
                style={{ ...BTN, width: 'auto' }}
                onClick={() => { onClose(); navigate('/dashboard', { state: { company: agentResult?.company } }) }}
              >
                عرض لوحة المعلومات
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Duplicate ─────────────────────────────────────────────────────────────
  if (status === 'duplicate') {
    return (
      <div style={OVERLAY}>
        <div style={BOX}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '1.0rem' }}>تنبيه</h2>
          <p style={{ fontSize: '15px', color: 'var(--text-2)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            يوجد تقرير لـ <strong style={{ color: 'var(--text-1)' }}>{agentResult?.period}</strong> مسجّل مسبقًا لـ <strong style={{ color: 'var(--text-1)' }}>{agentResult?.company}</strong>. هل تريد استبداله؟
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={BTN2} onClick={() => setStatus(null)}>إلغاء</button>
            <button
              style={{ ...BTN, background: 'var(--negative)', opacity: loading ? 0.6 : 1 }}
              onClick={() => extractionSource === 'url' ? handleConfirmAndExtract(true) : handleManualExtract(true)}
              disabled={loading}
            >
              {loading ? 'جارٍ الاستبدال...' : 'استبدال'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <>
      <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div style={BOX}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-1)' }}>إضافة تقرير</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>

          {/* Company autocomplete */}
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <label style={LABEL}>الشركة</label>
            <input
              ref={inputRef}
              style={INPUT}
              placeholder="اكتب اسم الشركة أو رمزها..."
              value={selectedCompany ? `${selectedCompany.name_ar} (${selectedCompany.ticker})` : query}
              onChange={e => { setQuery(e.target.value); setSelectedCompany(null) }}
              onFocus={() => query && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            {showDropdown && (
              
              <div style={{
                position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 100,
                background: 'var(--surface)', border: '1px solid var(--border-2)',
                borderRadius: 'var(--radius)', marginTop: '4px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden',
                textAlign: 'right'
              }}>
                {suggestions.length > 0 ? suggestions.map(c => (
                  <div
                    key={c.ticker}
                    onMouseDown={() => { setSelectedCompany(c); setQuery(''); setShowDropdown(false) }}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-1)' }}>{c.name_ar}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{c.name}</div>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>{c.ticker}</span>
                  </div>
                )) : (
                  <div
                    onMouseDown={() => setShowDropdown(false)}
                    style={{ padding: '10px 14px', fontSize: '14px', color: 'var(--text-2)', cursor: 'pointer' }}
                  >
                    🔍 البحث عن "{query}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Year + Period */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={LABEL}>السنة</label>
              <select style={SELECT} value={year} onChange={e => setYear(e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={LABEL}>الفترة</label>
              <select style={SELECT} value={period} onChange={e => setPeriod(e.target.value)}>
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Duplicate warning */}
          {isDuplicate && (
            <div style={{
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid var(--negative)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              marginBottom: '0.75rem',
            }}>
              <p style={{ fontSize: '13px', color: 'var(--negative)', margin: 0 }}>
                يوجد تقرير لهذه الشركة والفترة بالفعل في النظام. يمكنك المتابعة لاستبداله.
              </p>
            </div>
          )}

          {/* Find Report button */}
          <button
            style={{
              ...BTN,
              opacity: !canFindReport || searching ? 0.6 : 1,
              cursor: !canFindReport || searching ? 'not-allowed' : 'pointer',
              marginBottom: '1.25rem',
            }}
            onClick={handleFindReport}
            disabled={!canFindReport || searching}
          >
            {searching ? 'جارٍ البحث...' : 'البحث عن التقرير تلقائيًا'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-2)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>أو أرفع التقرير بنفسك</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-2)' }} />
          </div>

          {/* Manual upload */}
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: `1px dashed ${file ? 'var(--accent)' : 'var(--border-2)'}`,
              borderRadius: 'var(--radius)', padding: '1.5rem',
              textAlign: 'center', cursor: 'pointer',
              background: file ? 'var(--accent-glow)' : 'var(--surface-2)',
              transition: 'border-color 0.2s, background 0.2s',
              marginBottom: '0.75rem',
            }}
          >
            <p style={{ fontSize: '14px', color: file ? 'var(--accent)' : 'var(--text-2)', margin: 0 }}>
              {file ? file.name : 'اضغط لاختيار ملف PDF'}
            </p>
          </div>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />

          <button
            style={{
              ...BTN,
              opacity: !canExtract || loading ? 0.6 : 1,
              cursor: !canExtract || loading ? 'not-allowed' : 'pointer',
            }}
            onClick={() => handleManualExtract(false)}
            disabled={!canExtract || loading}
          >
            {loading ? 'جارٍ الاستخلاص...' : 'استخلاص البيانات'}
          </button>

          {/* Error */}
          {status === 'error' && (
            <p style={{ fontSize: '15px', color: 'var(--negative)', marginTop: '0.75rem', textAlign: 'center' }}>
              حدث خطأ. يرجى المحاولة مرة أخرى.
            </p>
          )}

        </div>
      </div>

      {/* Result modal — rendered on top */}
      {showResultModal && (
        <ResultModal
          status={status}
          agentResult={agentResult}
          loading={loading}
          onConfirm={handleConfirmAndExtract}
          onClose={() => setShowResultModal(false)}
        />
      )}
    </>
  )
}