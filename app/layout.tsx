import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { RoleOnboardingDialog } from "@/components/role-onboarding-dialog"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "@/components/ui/toast"
import { ProjectsProvider } from "@/lib/store"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster>
              <ProjectsProvider>
                <RoleOnboardingDialog />
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset>
                    <SiteHeader />
                    {children}
                  </SidebarInset>
                </SidebarProvider>
              </ProjectsProvider>
            </Toaster>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
