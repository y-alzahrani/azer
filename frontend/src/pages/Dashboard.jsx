import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import SummaryCard from '../components/SummaryCard'
import SectionHeader from '../components/SectionHeader'

const API = 'http://localhost:8000'

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(value, unit) {
  if (value == null) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  // Normalize to actual value first
  let actual
  if (unit === 'Thousands')  actual = abs * 1_000
  else if (unit === 'Millions') actual = abs * 1_000_000
  else if (unit === 'Billions') actual = abs * 1_000_000_000
  else actual = abs  // raw figures

  if (actual >= 1_000_000_000_000) return `\u200E${sign}${(actual / 1_000_000_000_000).toFixed(2)} ترليون`
  if (actual >= 1_000_000_000)     return `\u200E${sign}${(actual / 1_000_000_000).toFixed(2)} مليار`
  if (actual >= 1_000_000)         return `\u200E${sign}${(actual / 1_000_000).toFixed(2)} مليون`
  return `\u200E${sign}${actual.toFixed(2)}`
}

function fmtPct(value) {
  if (value == null) return '—'
  return `${(value * 100).toFixed(1)}%`
}

function fmtRatio(value) {
  if (value == null) return '—'
  return value.toFixed(2) + 'x'
}

function fmtCurrency(currency) {
  if (currency === 'SAR') return 'ريال'
  if (currency === 'USD') return 'دولار'
  return currency
}

const CHART_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '1.25rem',
}

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface-2)',
  border: '1px solid var(--border-2)',
  borderRadius: '8px',
  color: 'var(--text-1)',
  fontFamily: 'var(--font)',
  fontSize: '13px',
}

function ChartLabel({ children }) {
  return (
    <p style={{ fontSize: '15px', color: 'var(--text-2)', marginBottom: '12px', fontWeight: '450', textAlign: 'center' }}>
      {children}
    </p>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [companies, setCompanies]     = useState([])
  const [company, setCompany]         = useState('')
  const [financials, setFinancials]   = useState(null)
  const [summary, setSummary]         = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [loading, setLoading]         = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Load company list
  useEffect(() => {
    fetch(`${API}/documents`)
      .then(r => r.json())
      .then(data => {
        const names = Object.keys(data)
        setCompanies(names)
        if (location.state?.company && names.includes(location.state.company)) {
          setCompany(location.state.company)
        } else if (names.length > 0) {
          setCompany(names[0])
        }
      })
  }, [])

  // Load financials when company changes
  useEffect(() => {
    if (!company) return
    setLoading(true)
    fetch(`${API}/financials/${company}`)
      .then(r => r.json())
      .then(data => {
        setFinancials(data)
        setLoading(false)
      })
  }, [company])

  // Load summary when company changes
  useEffect(() => {
    if (!company) return
    setSummary(null)
    fetch(`${API}/summary/${company}`)
      .then(r => r.json())
      .then(data => setSummary(data.summary))
  }, [company])

  // Current period entry
  const current = financials
  ? [...financials.Annual, ...financials.Quarterly]
      .sort((a, b) => b.period_end_date.localeCompare(a.period_end_date))[0]
  : null

  const [chartType, setChartType] = useState('Annual')
  
  // Annual entries sorted chronologically for charts
  const annualData = financials
  ? [...financials[chartType]].sort((a, b) => a.period_end_date.localeCompare(b.period_end_date))
  : []

  const currency = current?.currency || ''
  const unit = current?.unit || 'Millions'

  // ── Summary cards ──────────────────────────────────────────────────────

  const cards = current ? [
    { label: 'سعر السهم',            value: current.share_price ? `${current.share_price.toFixed(2)} ${fmtCurrency(currency)}` : '—' },
    { label: 'القيمة السوقية',        value: current.market_cap ? fmt(current.market_cap, unit) + ` ${fmtCurrency(currency)}`: '—' },
    { label: 'الإيرادات',            value: current.revenue ? fmt(current.revenue, unit) + ` ${fmtCurrency(currency)}` : '—' },
    { label: 'صافي الربح',           value: current.net_income ? fmt(current.net_income, unit) + ` ${fmtCurrency(currency)}` : '—' },
    { label: 'هامش الربح الصافي',    value: fmtPct(current.net_margin) },
    { label: 'التدفق النقدي الحر',   value: current.free_cash_flow ? fmt(current.free_cash_flow, unit) + ` ${fmtCurrency(currency)}` : '—' },
    { label: 'صافي الدين',           value: current.net_debt ? fmt(current.net_debt, unit) + ` ${fmtCurrency(currency)}` : '—' },
    { label: 'مكرر الأرباح المستقبلي',          value: current.forward_pe_ratio ? (current.forward_pe_ratio).toFixed(1) : '—' },
  ] : []

  // ── Render ─────────────────────────────────────────────────────────────

  const selectStyle = {
    fontFamily: 'var(--font)',
    fontSize: '14px',
    background: 'var(--surface)',
    color: 'var(--text-1)',
    border: '1.6px solid var(--border-2)',
    borderRadius: 'var(--radius)',
    padding: '1px 10px',
    marginTop: '2.5px',
    cursor: 'pointer',
    outline: 'none',
    direction: 'rtl',
  }


  return (
    <div style={{ maxWidth: '1330px', margin: '0 auto', padding: '2rem' }}>

{/* ── Company + Period selector ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '2rem',
        justifyContent: 'flex-end',
      }}>
        <select style={selectStyle} value={company} onChange={e => setCompany(e.target.value)}>
          {companies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span style={{ fontSize: '35px', fontWeight: '700', color: 'var(--text-1)', marginRight: '22px' }}>
          {company}
        </span>
      </div>

      {loading && (
        <p style={{ color: 'var(--text-2)', textAlign: 'center', padding: '4rem 0' }}>جارٍ التحميل...</p>
      )}

      {!loading && current && (
        <>
          {/* ── ١. مؤشرات الفترة الأخيرة ─── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHeader title="مؤشرات الفترة الأخيرة" />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '12px',
            }}>
              {cards.map(card => (
                <SummaryCard key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          </section>

          {/* ── ٢. الربحية والتدفق النقدي─── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', justifyContent: 'flex-start' }}>
              {['Annual', 'Quarterly'].map(type => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  style={{
                    fontFamily: 'var(--font)',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: chartType === type ? 'var(--accent)' : 'var(--surface-2)',
                    color: chartType === type ? 'white' : 'var(--text-2)',
                    border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius)',
                    padding: '6px 16px',
                    cursor: 'pointer',
                    marginBottom: '5px'
                  }}
                >
                  {type === 'Annual' ? 'سنوي' : 'ربعي'}
                </button>
              ))}
            </div>
            <SectionHeader title="الربحية والتدفق النقدي" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              <div style={CHART_STYLE}>
                <ChartLabel>الإيرادات</ChartLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={annualData} margin={{ right: 15, left: 0, top: 10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" tickFormatter={v => v.replace('FY ', '')} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)' }} />
                    <YAxis domain={['auto', 'auto']}
                      tickFormatter={v => {
                        if (Math.abs(v) >= 1_000_000) return `${(v/1_000_000).toFixed(1)}T`
                        if (Math.abs(v) >= 1_000) return `${(v/1_000).toFixed(0)}B`
                        return v
                      }}
                      tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)', direction: 'ltr' }} 
                      width={50} 
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(v, unit), 'الإيرادات']} labelFormatter={(label) => label.replace('FY ', '')} cursor={{ fill: 'rgba(255,255,255,0.1)' }}/>
                    <Bar dataKey="revenue" fill="#F87171" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={CHART_STYLE}>
                <ChartLabel>الربح التشغيلي</ChartLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={annualData} margin={{ right: 15, left: 0, top: 10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" tickFormatter={v => v.replace('FY ', '')} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)' }} />
                    <YAxis domain={['auto', 'auto']}
                      tickFormatter={v => {
                        if (Math.abs(v) >= 1_000_000) return `${(v/1_000_000).toFixed(1)}T`
                        if (Math.abs(v) >= 1_000) return `${(v/1_000).toFixed(0)}B`
                        return v
                      }}
                      tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)', direction: 'ltr' }} 
                      width={50} 
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(v, unit), 'الربح التشغيلي']} labelFormatter={(label) => label.replace('FY ', '')} cursor={{ fill: 'rgba(255,255,255,0.1)' }}/>
                    <Bar dataKey="operating_income" fill="#60A5FA" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={CHART_STYLE}>
                <ChartLabel>صافي الربح</ChartLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={annualData} margin={{ right: 15, left: 0, top: 10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" tickFormatter={v => v.replace('FY ', '')} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)' }} />
                    <YAxis domain={['auto', 'auto']}
                      tickFormatter={v => {
                        if (Math.abs(v) >= 1_000_000) return `${(v/1_000_000).toFixed(1)}T`
                        if (Math.abs(v) >= 1_000) return `${(v/1_000).toFixed(0)}B`
                        return v
                      }}
                      tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)', direction: 'ltr' }} 
                      width={50} 
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(v, unit), 'صافي الربح']} labelFormatter={(label) => label.replace('FY ', '')} cursor={{ fill: 'rgba(255,255,255,0.1)' }}/>
                    <Bar dataKey="net_income" fill="#34D399" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={CHART_STYLE}>
                <ChartLabel>التدفق النقدي الحر</ChartLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={annualData} margin={{ right: 15, left: 0, top: 10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" tickFormatter={v => v.replace('FY ', '')} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)' }} />
                    <YAxis domain={['auto', 'auto']}
                      tickFormatter={v => {
                        if (Math.abs(v) >= 1_000_000) return `${(v/1_000_000).toFixed(1)}T`
                        if (Math.abs(v) >= 1_000) return `${(v/1_000).toFixed(0)}B`
                        return v
                      }}
                      tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)', direction: 'ltr' }} 
                      width={50} 
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(v, unit), 'التدفق النقدي الحر']} labelFormatter={(label) => label.replace('FY ', '')} cursor={{ fill: 'rgba(255,255,255,0.1)' }}/>
                    <Bar dataKey="free_cash_flow" fill="#ffd755" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </section>

          {/* ── ٣. هوامش الربح ─── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHeader title="هوامش الربح" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              <div style={CHART_STYLE}>
                <ChartLabel>هامش الربح التشغيلي</ChartLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={annualData} margin={{ right: 15, left: 0, top: 10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" tickFormatter={v => v.replace('FY ', '')} padding={{ left: 30, right: 30 }} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)' }} />
                    <YAxis domain={['auto', 'auto']} tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)', direction: 'ltr' }} width={44} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmtPct(v), 'هامش الربح التشغيلي']} labelFormatter={(label) => label.replace('FY ', '')} />
                    <Line dataKey="operating_margin" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={CHART_STYLE}>
                <ChartLabel>هامش الربح الصافي</ChartLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={annualData} margin={{ right: 15, left: 0, top: 10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" tickFormatter={v => v.replace('FY ', '')} padding={{ left: 30, right: 30 }} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)' }} />
                    <YAxis domain={['auto', 'auto']} tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)', direction: 'ltr' }} width={44} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmtPct(v), 'هامش الربح الصافي']} labelFormatter={(label) => label.replace('FY ', '')} />
                    <Line dataKey="net_margin" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>
          </section>

          {/* ── ٤. الميزانية ─── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHeader title="الميزانية" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              <div style={CHART_STYLE}>
                <ChartLabel>النقد وما يعادله</ChartLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={annualData} margin={{ right: 15, left: 0, top: 10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" tickFormatter={v => v.replace('FY ', '')} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)' }} />
                    <YAxis domain={['auto', 'auto']}
                      tickFormatter={v => {
                        if (Math.abs(v) >= 1_000_000) return `${(v/1_000_000).toFixed(1)}T`
                        if (Math.abs(v) >= 1_000) return `${(v/1_000).toFixed(0)}B`
                        return v
                      }}
                      tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)', direction: 'ltr' }} 
                      width={50} 
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(v, unit), 'النقد وما يعادله']} labelFormatter={(label) => label.replace('FY ', '')} cursor={{ fill: 'rgba(255,255,255,0.1)' }}/>
                    <Bar dataKey="cash_and_equivalents" fill="#34D399" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={CHART_STYLE}>
                <ChartLabel>إجمالي الديون</ChartLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={annualData} margin={{ right: 15, left: 0, top: 10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" tickFormatter={v => v.replace('FY ', '')} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)' }} />
                    <YAxis domain={['auto', 'auto']}
                      tickFormatter={v => {
                        if (Math.abs(v) >= 1_000_000) return `${(v/1_000_000).toFixed(1)}T`
                        if (Math.abs(v) >= 1_000) return `${(v/1_000).toFixed(0)}B`
                        return v
                      }}
                      tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)', direction: 'ltr' }} 
                      width={50} 
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(v, unit), 'إجمالي الديون']} labelFormatter={(label) => label.replace('FY ', '')} cursor={{ fill: 'rgba(255,255,255,0.1)' }}/>
                    <Bar dataKey="total_debt" fill="#F87171" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={CHART_STYLE}>
                <ChartLabel>صافي الدين</ChartLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={annualData} margin={{ right: 15, left: 0, top: 10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" padding={{ left: 30, right: 30 }} tickFormatter={v => v.replace('FY ', '')} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)' }} />
                    <YAxis domain={['auto', 'auto']}
                      tickFormatter={v => {
                        if (Math.abs(v) >= 1_000_000) return `${(v/1_000_000).toFixed(1)}T`
                        if (Math.abs(v) >= 1_000) return `${(v/1_000).toFixed(0)}B`
                        return v
                      }}
                      tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)', direction: 'ltr' }} 
                      width={50} 
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(v, unit), 'صافي الدين']} labelFormatter={(label) => label.replace('FY ', '')} />
                    <Line dataKey="net_debt" stroke="#FBBF24" strokeWidth={2} dot={{ fill: '#FBBF24', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={CHART_STYLE}>
                <ChartLabel>نسبة الدين إلى حقوق الملكية</ChartLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={annualData} margin={{ right: 15, left: 0, top: 10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" padding={{ left: 30, right: 30 }} tickFormatter={v => v.replace('FY ', '')} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)' }} />
                    <YAxis domain={['auto', 'auto']} tickFormatter={v => v.toFixed(2)} tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'var(--font)', direction: 'ltr' }} width={44} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v.toFixed(2), 'نسبة الدين إلى حقوق الملكية']} labelFormatter={(label) => label.replace('FY ', '')} />
                    <Line dataKey="debt_to_equity" stroke="#A78BFA" strokeWidth={2} dot={{ fill: '#A78BFA', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>
          </section>

          {/* ── ٥. مضاعفات التقييم ─── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHeader title="مضاعفات التقييم" />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
            }}>
              {[
                { label: 'ربحية السهم',        value: current.eps ? `${current.eps.toFixed(2)} ${fmtCurrency(currency)}` : '—' },
                { label: 'السعر / الأرباح (لآخر 12 شهر)',        value: current.trailing_pe_ratio ? (current.trailing_pe_ratio).toFixed(1) : '—' },
                { label: 'السعر / الأرباح (للـ 12 شهرًا القادمة)',value: current.forward_pe_ratio ? (current.forward_pe_ratio).toFixed(1) : '—' },
                { label: 'السعر / الإيرادات',        value: current.ps_ratio ? (current.ps_ratio).toFixed(1) : '—' },
                { label: 'السعر / القيمة الدفترية',        value: current.pb_ratio ? (current.pb_ratio).toFixed(1) : '—' },
              ].map(card => (
                <SummaryCard key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          </section>

          {/* ── ٦. التحليل الذكي ─── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHeader title="التحليل الذكي" />

            {!summary && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem',
                textAlign: 'center',
              }}>
                <p style={{ color: 'var(--text-2)', marginBottom: '1.25rem', fontSize: '15px' }}>
                  لم يتم توليد التحليل بعد
                </p>
                <button
                  onClick={async () => {
                    setSummaryLoading(true)
                    const res = await fetch(`${API}/summary/${company}/generate`, { method: 'POST' })
                    const data = await res.json()
                    setSummary(data.summary)
                    setSummaryLoading(false)
                  }}
                  disabled={summaryLoading}
                  style={{
                    fontFamily: 'var(--font)',
                    fontSize: '15px',
                    fontWeight: '500',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    padding: '10px 24px',
                    cursor: summaryLoading ? 'wait' : 'pointer',
                    opacity: summaryLoading ? 0.7 : 1,
                  }}
                >
                  {summaryLoading ? 'جارٍ التوليد...' : 'توليد'}
                </button>
              </div>
            )}

            {summary && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
              }}>
                {/* Positives + Negatives side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>

                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--positive)', marginBottom: '1rem' }}>
                      ✓ الإيجابيات
                    </h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {summary['الإيجابيات']?.map((point, i) => (
                        <li key={i} style={{
                          fontSize: '15px',
                          color: 'var(--text-1)',
                          lineHeight: 1.65,
                          paddingRight: '12px',
                          borderRight: '2px solid var(--positive)',
                        }}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--negative)', marginBottom: '1rem' }}>
                      ✗ السلبيات
                    </h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {summary['السلبيات']?.map((point, i) => (
                        <li key={i} style={{
                          fontSize: '15px',
                          color: 'var(--text-1)',
                          lineHeight: 1.65,
                          paddingRight: '12px',
                          borderRight: '2px solid var(--negative)',
                        }}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* النظرة العامة */}
                <div style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '1.5rem',
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--accent)', marginBottom: '1rem' }}>
                    النظرة العامة
                  </h3>
                  <p style={{
                    fontSize: '15px',
                    color: 'var(--text-1)',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-line',
                  }}>
                    {summary['النظرة العامة']}
                  </p>
                </div>
                {/* Update button */}
                <div style={{ marginTop: '1.0rem', marginBottom: '0.0rem', marginLeft: '0.0rem', textAlign: 'left' }}>
                  <button
                    onClick={async () => {
                      setSummaryLoading(true)
                      const res = await fetch(`${API}/summary/${company}/generate`, { method: 'POST' })
                      const data = await res.json()
                      setSummary(data.summary)
                      setSummaryLoading(false)
                    }}
                    disabled={summaryLoading}
                    style={{
                      fontFamily: 'var(--font)',
                      fontSize: '15px',
                      fontWeight: '500',
                      background: 'var(--surface-1)',
                      color: 'var(--text-2)',
                      border: '2.0px solid var(--border-2)',
                      borderRadius: 'var(--radius)',
                      padding: '6px 16px',
                      cursor: summaryLoading ? 'wait' : 'pointer',
                    }}
                  >
                    {summaryLoading ? 'جارٍ التحديث...' : 'تحديث التحليل'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Floating chatbot button ─── */}
      <button
        onClick={() => navigate('/chat')}
        style={{
          position: 'fixed',
          bottom: '28px',
          left: '28px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--accent)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(157,111,232,0.4)',
          zIndex: 200,
        }}
        title="المساعد المالي"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
        
    </div>
  )
}
