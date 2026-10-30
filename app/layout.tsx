import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "./globals.css"
import { AppFrame } from "@/components/shell/app-frame"
import { RouterProvider } from "@/components/router-provider"
import { ScrollbarReveal } from "@/components/scrollbar-reveal"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/untitled/application/notifications/toast"
import { ProjectsProvider } from "@/lib/store"
import { cn } from "@/lib/utils"

/** One face for the whole interface, as Untitled UI specifies. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "PDM ProjectGarage",
  description:
    "Milestones, reviews, meetings and announcements for the PDM final project at IIIT Hyderabad.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans antialiased", inter.variable)}
    >
      <body>
        <ThemeProvider>
          <ProjectsProvider>
            <RouterProvider>
              <AppFrame>{children}</AppFrame>
            </RouterProvider>
          </ProjectsProvider>
          <Toaster />
          <ScrollbarReveal />
        </ThemeProvider>
      </body>
    </html>
  )
}
