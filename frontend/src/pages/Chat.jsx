import { useState, useEffect, useRef } from 'react'

const API = 'http://localhost:8000'

export default function Chat() {
  const [companies, setCompanies] = useState([])
  const [company, setCompany] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

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

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, company }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.response, citations: data.citations }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'حدث خطأ أثناء الاتصال بالخادم.', citations: [] }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectStyle = {
    fontFamily: 'var(--font)',
    fontSize: '14px',
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
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      direction: 'rtl',
      fontFamily: 'var(--font)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 56px)',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-1)' }}>
          المساعد المالي
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>الشركة:</span>
          <select style={selectStyle} value={company} onChange={e => setCompany(e.target.value)}>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Message list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '1rem',
      }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-3)',
            gap: '12px',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ fontSize: '15px', color: 'var(--text-2)', marginBottom: '1rem' }}>
              اسأل عن أداء {company} المالي
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              {[
                `كم بلغت إيرادات ${company} في آخر سنة؟`,
                `كيف تغير هامش الربح الصافي لـ ${company} عبر السنوات؟`,
                `ماذا قالت إدارة ${company} عن خططها المستقبلية؟`,
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  style={{
                    fontFamily: 'var(--font)',
                    fontSize: '13px',
                    background: 'var(--surface)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius)',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    direction: 'rtl',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end',
          }}>
            <div style={{
              maxWidth: '75%',
              background: msg.role === 'user' ? '#a973ffcd' : 'var(--surface)',
              color: 'var(--text-1)',
              border: msg.role === 'bot' ? '1px solid var(--border)' : 'none',
              borderRadius: msg.role === 'user'
                ? 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px'
                : 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: 1.7,
              wordBreak: 'break-word',
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              {msg.citations && msg.citations.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  {msg.citations.map((cite, j) => (
                    <p key={j} style={{ fontSize: '11px', color: 'var(--text-3)', margin: '2px 0' }}>
                      {cite}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)',
              padding: '12px 16px',
              fontSize: '14px',
              color: 'var(--text-3)',
            }}>
              جارٍ التفكير...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-end',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="أكتب سؤالك هنا..."
          rows={1}
          style={{
            flex: 1,
            fontFamily: 'var(--font)',
            fontSize: '14px',
            fontWeight: '400',
            background: 'var(--surface)',
            color: 'var(--text-1)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            outline: 'none',
            direction: 'rtl',
            resize: 'none',
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            fontFamily: 'var(--font)',
            fontSize: '14px',
            fontWeight: '500',
            background: loading || !input.trim() ? 'var(--surface-2)' : '#a973ffcd',
            color: loading || !input.trim() ? 'var(--text-3)' : 'white',
            border: 'none',
            borderRadius: 'var(--radius)',
            padding: '10px 20px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          إرسال
        </button>
      </div>

    </div>
  )
}
