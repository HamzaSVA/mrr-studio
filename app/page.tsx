export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#08081a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      color: '#e2e8f0'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>MRR Studio</h1>
        <p style={{ color: '#9ca3af', marginBottom: 32 }}>TikTok Growth OS</p>
        <a href="/dashboard" style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: '#fff',
          padding: '12px 28px',
          borderRadius: 10,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: 15
        }}>
          Accéder au dashboard →
        </a>
      </div>
    </main>
  )
}
