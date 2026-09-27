import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { AppFrame } from "@/components/shell/app-frame"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toast"
import { ProjectsProvider } from "@/lib/store"
import { cn } from "@/lib/utils"

/** One face for the whole interface, as on master. Geist carries tabular
 *  figures, which twenty-two rows of dates and counts depend on. */
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" })

/** For identifiers, timestamps and pasted links — anything read character by
 *  character rather than as a word. */
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

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
      className={cn("antialiased font-sans", sans.variable, mono.variable)}
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
