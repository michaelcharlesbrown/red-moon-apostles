import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Red Moon Apostles",
  description: "Generative audiovisual experience",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
