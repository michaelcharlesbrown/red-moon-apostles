import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Red Moon Apostles",
  description: "Generative audiovisual experience",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
