import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import './styles/global.css'
import Home from './pages/Home'

// Placeholder pages — to be built
function Documents() { return <div style={{ padding: '2rem', color: 'var(--text-1)' }}>مستنداتي — قريباً</div> }
function Chat()      { return <div style={{ padding: '2rem', color: 'var(--text-1)' }}>المحادثة — قريباً</div> }
function DCF()       { return <div style={{ padding: '2rem', color: 'var(--text-1)' }}>التقييم — قريباً</div> }

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/chat"      element={<Chat />} />
        <Route path="/dcf"       element={<DCF />} />
      </Routes>
    </BrowserRouter>
  )
}
