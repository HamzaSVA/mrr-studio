import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MRR Studio — TikTok Growth OS',
  description: 'Génère des scripts TikTok, prospecte et audite ton compte avec IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: '#08081a', color: '#e2e8f0' }}>
        {children}
      </body>
    </html>
  )
}
