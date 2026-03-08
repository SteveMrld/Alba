export const metadata = {
  title: 'ALBA — L\'aube en toi',
  description: 'Compagnon de présence et d\'accompagnement intérieur',
}
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: '#131110' }}>{children}</body>
    </html>
  )
}
