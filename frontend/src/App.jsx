import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import './styles/global.css'
import Home from './pages/Home'
import MyDocuments from './pages/MyDocuments'
import DCF from './pages/DCF'
import Chatbot from './pages/Chatbot'
import Glossary from './pages/Glossary'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<MyDocuments />} />
        <Route path="/chatbot"      element={<Chatbot />} />
        <Route path="/dcf"       element={<DCF />} />
        <Route path="/glossary" element={<Glossary />} />
      </Routes>
    </BrowserRouter>
  )
}
