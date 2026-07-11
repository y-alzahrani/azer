import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadModal from '../components/UploadModal'

const API = 'http://localhost:8000'

const BTN = {
  fontFamily: 'var(--font)',
  fontSize: '13px',
  background: 'var(--surface-2)',
  color: 'var(--text-2)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--radius)',
  padding: '5px 14px',
  cursor: 'pointer',
}

const REPORT_TYPE_LABEL = {
  Annual: 'سنوي',
  Quarterly: 'ربعي',
}

export default function MyDocuments() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState({})
  const [expanded, setExpanded] = useState({})
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function loadDocuments() {
    fetch(`${API}/documents`)
      .then(r => r.json())
      .then(data => {
        // Sort reports descending (most recent first)
        Object.keys(data).forEach(company => {
          data[company].reports.sort((a, b) => b.period_end_date.localeCompare(a.period_end_date))
        })
        setDocuments(data)
        const expandedState = {}
        Object.keys(data).forEach(c => expandedState[c] = true)
        setExpanded(expandedState)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  function toggleCompany(company) {
    setExpanded(prev => ({ ...prev, [company]: !prev[company] }))
  }

  function openDashboard(company) {
    navigate('/dashboard', { state: { company } })
  }

  function openPdf(company, reportType, period) {
    const periodSlug = period.toLowerCase().replace(' ', '_')
    const companySlug = company.toLowerCase()
    const filename = `${companySlug}_${periodSlug}.pdf`
    window.open(`${API}/pdf/${company}/${reportType}/${filename}`, '_blank')
  }

  async function handleDelete({ company, period, report_type }) {
    const periodSlug = period.toLowerCase().replace(' ', '_')
    const companySlug = company.toLowerCase()
    const filename = `${companySlug}_${periodSlug}.json`
    await fetch(`${API}/delete/${company}/${report_type}/${filename}`, { method: 'DELETE' })
    setDeleteTarget(null)
    loadDocuments()
  }

  const companies = Object.keys(documents)

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '2rem',
      direction: 'rtl',
      fontFamily: 'var(--font)',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-1)' }}>
          مستنداتي
        </h1>
        <button
          onClick={() => setShowUpload(true)}
          style={{
            fontFamily: 'var(--font)',
            fontSize: '14px',
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
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ color: 'var(--text-2)', textAlign: 'center', padding: '4rem 0' }}>
          جارٍ التحميل...
        </p>
      )}

      {/* Empty state */}
      {!loading && companies.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-1)' }}>
          <p style={{ fontSize: '16px', marginBottom: '1rem' }}>لا توجد تقارير مرفوعة بعد</p>

        </div>
      )}

      {/* Company list */}
      {!loading && companies.map(company => (
        <div key={company} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          marginBottom: '35px',
          overflow: 'hidden',
        }}>

          {/* Company header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              cursor: 'pointer',
            }}
            onClick={() => toggleCompany(company)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{ fontSize: '20px', fontWeight: '600', color: 'var(--accent)', cursor: 'pointer', marginLeft: '5px' }}
                onClick={e => { e.stopPropagation(); openDashboard(company) }}
              >
                {company}
              </span>
              <span style={{
                fontSize: '13px',
                color: 'var(--text-2)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-2)',
                borderRadius: '6px',
                padding: '2px 8px',
              }}>
                {documents[company].reports.length} تقارير
              </span>
            </div>
            <span style={{ color: 'var(--text-2)', fontSize: '14px' }}>
              {expanded[company] ? '▲' : '▼'}
            </span>
          </div>

          {/* Reports table */}
          {expanded[company] && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <th style={{ padding: '10px 2.6rem', color: 'var(--text-2)', fontWeight: '500', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>الفترة</th>
                    <th style={{ padding: '10px 1.25rem', color: 'var(--text-2)', fontWeight: '500', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>نوع التقرير</th>
                    <th style={{ padding: '10px 1.25rem', color: 'var(--text-2)', fontWeight: '500', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>تاريخ نهاية الفترة</th>
                    <th style={{ padding: '10px 1.25rem', color: 'var(--text-2)', fontWeight: '500', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {documents[company].reports.map((report, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 1.25rem', color: 'var(--text-1)', fontWeight: '500', textAlign: 'center', fontSize: '15px' }}>
                        {report.period}
                      </td>
                      <td style={{ padding: '10px 1.25rem', color: 'var(--text-2)', textAlign: 'center', fontSize: '15px' }}>
                        {REPORT_TYPE_LABEL[report.report_type] || report.report_type}
                      </td>
                      <td style={{ padding: '10px 1.25rem', color: 'var(--text-2)', textAlign: 'center', fontSize: '15px' }}>
                        {report.period_end_date}
                      </td>
                      <td style={{ padding: '10px 1.25rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                          <button
                            style={BTN}
                            onClick={() => openPdf(company, report.report_type, report.period)}
                          >
                            عرض التقرير
                          </button>
                          <button
                            style={{ ...BTN, color: 'var(--negative)', borderColor: 'var(--negative)' }}
                            onClick={() => setDeleteTarget({ company, period: report.period, report_type: report.report_type })}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border-2)',
            borderRadius: 'var(--radius-lg)', padding: '1.5rem', maxWidth: '350px',
            width: '100%', direction: 'rtl', fontFamily: 'var(--font)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '12px' }}>
              تأكيد الحذف
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-2)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              سيتم حذف تقرير{' '}
              <strong style={{ color: 'var(--text-1)' }}>{deleteTarget.period}</strong>{' '}
              لشركة{' '}
              <strong style={{ color: 'var(--text-1)' }}>{deleteTarget.company}</strong>.
              {' '}هل أنت متأكد أنك تريد حذفه؟
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{ fontFamily: 'var(--font)', fontSize: '14px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius)', padding: '8px 20px', cursor: 'pointer' }}
                onClick={() => setDeleteTarget(null)}
              >
                إلغاء
              </button>
              <button
                style={{ fontFamily: 'var(--font)', fontSize: '14px', fontWeight: '600', background: 'var(--negative)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '8px 20px', cursor: 'pointer' }}
                onClick={() => handleDelete(deleteTarget)}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <UploadModal onClose={() => { setShowUpload(false); loadDocuments() }} />
      )}

    </div>
  )
}
