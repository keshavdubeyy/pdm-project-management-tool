import type { Metadata } from "next"
import { Bricolage_Grotesque, Public_Sans } from "next/font/google"

import "./globals.css"
import { AppFrame } from "@/components/shell/app-frame"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toast"
import { ProjectsProvider } from "@/lib/store"
import { cn } from "@/lib/utils"

/** Display face. Does the shouting — headings, counts, the one big number. */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
  display: "swap",
})

/** Body face. Stays out of the way underneath it. */
const sans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "PDM Project Space",
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
      className={cn("antialiased font-sans", display.variable, sans.variable)}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster>
              <ProjectsProvider>
                <AppFrame>{children}</AppFrame>
              </ProjectsProvider>
            </Toaster>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
