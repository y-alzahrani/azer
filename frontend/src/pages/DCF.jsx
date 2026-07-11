import { useState, useEffect } from 'react'

const API = 'http://localhost:8000'

const INPUT_STYLE = {
  fontFamily: 'var(--font)',
  fontSize: '14px',
  background: 'var(--surface-2)',
  color: 'var(--text-1)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--radius)',
  padding: '8px 12px',
  width: '100%',
  outline: 'none',
  direction: 'ltr',
  textAlign: 'center',
  appearance: 'none',
  MozAppearance: 'textfield',
}

const LABEL_STYLE = {
  fontSize: '14px',
  color: 'var(--text-1)',
  marginBottom: '6px',
  display: 'block',
  textAlign: 'center',
}

const HINT_STYLE = {
  fontSize: '12px',
  color: 'var(--text-2)',
  marginTop: '4px',
  textAlign: 'center',
  lineHeight: 1.5,
}

const CARD_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '1.25rem',
}

const TH_STYLE = {
  padding: '10px 1rem',
  color: 'var(--text-2)',
  fontWeight: '500',
  textAlign: 'center',
  fontSize: '13px',
  background: 'var(--surface-2)',
}

const TD_STYLE = {
  padding: '10px 1rem',
  color: 'var(--text-1)',
  textAlign: 'center',
  fontSize: '14px',
  borderTop: '1px solid var(--border)',
}

// Convert raw value (in original unit) to actual absolute value
function toActual(value, unit) {
  if (value == null) return null
  if (unit === 'Thousands') return value * 1_000
  if (unit === 'Millions')  return value * 1_000_000
  if (unit === 'Billions')  return value * 1_000_000_000
  return value
}

// Determine best display unit based on magnitude
function getBestDisplayUnit(actualValue) {
  const abs = Math.abs(actualValue)
  if (abs >= 1_000_000_000_000) return { divisor: 1_000_000_000_000, label: 'ترليون' }
  if (abs >= 1_000_000_000)     return { divisor: 1_000_000_000,     label: 'مليار'   }
  if (abs >= 1_000_000)         return { divisor: 1_000_000,         label: 'مليون'   }
  if (abs >= 1_000)             return { divisor: 1_000,             label: 'ألف'     }
  return { divisor: 1, label: '' }
}

// Format for display in table
function fmt(value, unit) {
  if (value == null) return '—'
  const actual = toActual(value, unit)
  const abs = Math.abs(actual)
  const sign = actual < 0 ? '-' : ''
  const { divisor, label } = getBestDisplayUnit(abs)
  return `\u200E${sign}${(abs / divisor).toFixed(2)} ${label}`
}

function fmtCurrency(currency) {
  if (currency === 'SAR') return 'ريال'
  if (currency === 'USD') return 'دولار'
  return currency
}

function getValuationColor(label) {
  if (label?.includes('بشكل كبير') && label?.includes('أقل')) return '#4ADE80'
  if (label?.includes('أقل')) return '#84ffb1'
  if (label?.includes('مقيّم بقيمته العادلة')) return '#F59E0B'
  if (label?.includes('بشكل كبير') && label?.includes('أكثر')) return '#ff5959'
  if (label?.includes('أكثر')) return '#ff8383'
  return 'var(--text-2)'
}

export default function DCF() {
  const [companies, setCompanies] = useState([])
  const [company, setCompany] = useState('')
  const [refData, setRefData] = useState(null)
  const [loadingRef, setLoadingRef] = useState(false)

  // Inputs
  const [wacc, setWacc] = useState('')
  const [terminalGrowth, setTerminalGrowth] = useState('')
  const [projectionYears, setProjectionYears] = useState('')
  const [growthRate, setGrowthRate] = useState('')

  // projectedFcfs stored in DISPLAY units (e.g. billions)
  const [projectedFcfs, setProjectedFcfs] = useState([])
  // display unit info derived from base FCF magnitude
  const [displayUnit, setDisplayUnit] = useState({ divisor: 1_000_000_000, label: 'مليار' })

  // Results
  const [result, setResult] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState(null)

  // Load companies
  useEffect(() => {
    fetch(`${API}/documents`)
      .then(r => r.json())
      .then(data => {
        const names = Object.keys(data)
        setCompanies(names)
        if (names.length > 0) setCompany(names[0])
      })
  }, [])

  // Load reference data when company changes
  useEffect(() => {
    if (!company) return
    setLoadingRef(true)
    setResult(null)
    fetch(`${API}/dcf/${company}`)
      .then(r => r.json())
      .then(data => {
        setRefData(data)
        // Determine display unit from base FCF
        if (data.base_fcf) {
          const actual = toActual(data.base_fcf, data.unit)
          setDisplayUnit(getBestDisplayUnit(Math.abs(actual)))
        }
        setLoadingRef(false)
      })
  }, [company])

  // Auto-populate FCF projection table in display units
  useEffect(() => {
    if (!refData?.base_fcf || !growthRate) return
    const rate = parseFloat(growthRate) / 100
    if (isNaN(rate)) return

    const actualBase = toActual(refData.base_fcf, refData.unit)
    const fcfs = []
    let fcf = actualBase
    for (let i = 0; i < projectionYears; i++) {
      fcf = fcf * (1 + rate)
      // Store in display units, rounded to 2 decimal places
      fcfs.push(parseFloat((fcf / displayUnit.divisor).toFixed(2)))
    }
    setProjectedFcfs(fcfs)
  }, [growthRate, projectionYears, refData, displayUnit])

  function handleFcfChange(index, value) {
    const updated = [...projectedFcfs]
    updated[index] = parseFloat(value) || 0
    setProjectedFcfs(updated)
  }

  function handleReset() {
    setWacc('')
    setTerminalGrowth('')
    setProjectionYears('')
    setGrowthRate('')
    setProjectedFcfs([])
    setResult(null)
    setError(null)
  }

  async function handleCalculate() {
    if (!wacc || !terminalGrowth || projectedFcfs.length === 0) return
    setCalculating(true)
    setError(null)
    setResult(null)

    // Convert display units back to original unit for backend
    const originalUnit = refData.unit
    const fcfsForBackend = projectedFcfs.map(v => {
      const actual = v * displayUnit.divisor
      if (originalUnit === 'Thousands') return actual / 1_000
      if (originalUnit === 'Millions')  return actual / 1_000_000
      if (originalUnit === 'Billions')  return actual / 1_000_000_000
      return actual
    })

    try {
      const res = await fetch(`${API}/dcf/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          projected_fcfs: fcfsForBackend,
          wacc: parseFloat(wacc) / 100,
          terminal_growth_rate: parseFloat(terminalGrowth) / 100,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'حدث خطأ أثناء الحساب')
      } else {
        setResult(data)
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بالخادم')
    } finally {
      setCalculating(false)
    }
  }

  const currency = refData?.currency || ''
  const unit = refData?.unit || 'Millions'

  const selectStyle = {
    fontFamily: 'var(--font)',
    fontSize: '15px',
    background: 'var(--surface)',
    color: 'var(--text-1)',
    border: '1.9px solid var(--border-2)',
    borderRadius: 'var(--radius)',
    padding: '4px 12px',
    cursor: 'pointer',
    outline: 'none',
    direction: 'rtl',
  }

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '2rem',
      direction: 'rtl',
      fontFamily: 'var(--font)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-1)' }}>
          تقييم السهم
        </h1>
        <select style={selectStyle} value={company} onChange={e => { setCompany(e.target.value); handleReset() }}>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loadingRef && (
        <p style={{ color: 'var(--text-2)', textAlign: 'center', padding: '2rem 0' }}>جارٍ التحميل...</p>
      )}

      {refData && (
        <>
        <p style={{ fontSize: '15px', color: 'var(--text-1)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            استخدم نموذج التدفق النقدي المخصوم (Discounted Cash Flow) لحساب القيمة العادلة للسهم
          </p>

          {/* ── Reference panel ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

            {/* Key figures */}
            <div style={CARD_STYLE}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '1rem' }}>
                البيانات المرجعية
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'الفترة المرجعية', value: refData.fcf_history?.at(-1)?.period.replace('FY ', '') || '—' },
                  { label: 'القيمة السوقية', value: refData.share_price && refData.shares ? fmt(refData.share_price * refData.shares, unit) + ` ${fmtCurrency(currency)}` : '—' },
                  { label: 'صافي الدين', value: refData.net_debt != null ? `${fmt(refData.net_debt, unit)} ${fmtCurrency(currency)}` : '—' },
                  { label: 'عدد الأسهم القائمة', value: refData.shares ? `${fmt(refData.shares, unit)}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>{label}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-1)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical FCF table */}
            <div style={CARD_STYLE}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '1rem' }}>
                سجل التدفق النقدي الحر
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>السنة</th>
                    <th style={TH_STYLE}>التدفق النقدي الحر</th>
                    <th style={TH_STYLE}>النمو السنوي</th>
                  </tr>
                </thead>
                <tbody>
                  {refData.fcf_history.map((row, i) => (
                    <tr key={i}>
                      <td style={TD_STYLE}>{row.period.replace('FY ', '')}</td>
                      <td style={TD_STYLE}>{fmt(row.free_cash_flow, unit)} {fmtCurrency(currency)}</td>
                      <td style={{
                        ...TD_STYLE,
                        color: row.yoy_growth_pct > 0 ? 'var(--positive)' : row.yoy_growth_pct < 0 ? 'var(--negative)' : 'var(--text-2)',
                      }}>
                        {row.yoy_growth_pct != null ? `\u200E${row.yoy_growth_pct > 0 ? '+' : ''}${row.yoy_growth_pct}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* ── Input form ── */}
          <div style={{ ...CARD_STYLE, marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '1.25rem' }}>
              افتراضات النموذج
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

              <div>
                <label style={LABEL_STYLE}>متوسط تكلفة رأس المال (WACC) %</label>
                <input style={INPUT_STYLE} type="number" placeholder="10" value={wacc} onChange={e => setWacc(e.target.value)} />
                <p style={HINT_STYLE}>يتراوح عادةً بين 8% و 12% للشركات الكبيرة. كلما ارتفع تنخفض القيمة الجوهرية</p>
              </div>

              <div>
                <label style={LABEL_STYLE}>معدل النمو النهائي %</label>
                <input style={INPUT_STYLE} type="number" placeholder="3" value={terminalGrowth} onChange={e => setTerminalGrowth(e.target.value)} />
                <p style={HINT_STYLE}>عادةً ما يتراوح بين 2% و4%، ولا يتجاوز معدل نمو الاقتصاد على المدى البعيد</p>
              </div>

              <div>
                <label style={LABEL_STYLE}>عدد سنوات التوقع</label>
                <input style={INPUT_STYLE} type="number" min="1" max="15" placeholder="5" value={projectionYears} onChange={e => setProjectionYears(parseInt(e.target.value) || '')} />
              </div>

              <div>
                <label style={LABEL_STYLE}>معدل نمو التدفق النقدي الحر %</label>
                <input style={INPUT_STYLE} type="number" placeholder="5" value={growthRate} onChange={e => setGrowthRate(e.target.value)} />
              </div>

            </div>

            {/* Editable FCF projection table */}
            {projectedFcfs.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-1)', marginBottom: '13px', marginTop: '2rem' }}>
                  التدفق النقدي الحر المتوقع في المستقبل ({displayUnit.label} {fmtCurrency(currency)}). يمكنك تعديل القيم يدويًا
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {projectedFcfs.map((fcf, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>سنة {i + 1}</span>
                      <input
                        style={{ ...INPUT_STYLE, width: '110px', textAlign: 'center', marginBottom: '0.7rem' }}
                        type="number"
                        value={fcf}
                        onChange={e => handleFcfChange(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p style={{ fontSize: '13px', color: 'var(--negative)', marginBottom: '1rem' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCalculate}
                disabled={calculating || !wacc || !terminalGrowth || projectedFcfs.length === 0}
                style={{
                  fontFamily: 'var(--font)',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  padding: '10px 24px',
                  cursor: calculating || !wacc || !terminalGrowth || projectedFcfs.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: calculating || !wacc || !terminalGrowth || projectedFcfs.length === 0 ? 0.6 : 1,
                  marginRight: '0.6rem'
                }}
              >
                {calculating ? 'جارٍ الحساب...' : 'أحسب'}
              </button>

              <button
                onClick={handleReset}
                style={{
                  fontFamily: 'var(--font)',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: 'var(--surface-2)',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 24px',
                  cursor: 'pointer',
                }}
              >
                مسح
              </button>
            </div>
          </div>

          {/* ── Results ── */}
          {result && (
            <div style={{ ...CARD_STYLE, marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '1.25rem' }}>
                نتائج التقييم
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '60%', margin: '0 auto' }}>
                {[
                  { label: 'القيمة الجوهرية للسهم', value: `${result.intrinsic_value_per_share?.toFixed(2)} ${fmtCurrency(currency)}` },
                  { label: 'سعر السهم الحالي', value: result.current_price ? `${result.current_price.toFixed(2)} ${fmtCurrency(currency)}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius)',
                    padding: '0.7rem',
                    textAlign: 'center',
                    marginBottom: '1.45rem',
                  }}
                  
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-dim)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-2)'}>
                    <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px' }}>{label}</p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-1)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {result.valuation_label && (
                <div style={{
                  textAlign: 'center',
                  padding: '1.15rem',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${getValuationColor(result.valuation_label)}`,
                  width: '40%',
                  margin: '0 auto'
                }}>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: getValuationColor(result.valuation_label),
                  }}>
                    {result.valuation_label}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Disclaimer ── */}
          <p style={{ fontSize: '13px', color: 'var(--text-1)', textAlign: 'center', lineHeight: 1.6 }}>
            هذا التقدير مبني على افتراضاتك الشخصية ويتأثر بشدة بالأرقام المدخلة.
          </p>
        </>
      )}
    </div>
  )
}
