import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Calculator, FileText, Users, Package, ShoppingCart } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gestión de Productos Fríos",
  description: "Sistema de gestión para productos fríos y congelados",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <nav className="bg-primary shadow-lg">
                <div className="container mx-auto px-4">
                  <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2 text-white">
                      <Package className="h-6 w-6" />
                      <span className="font-bold text-lg">Productos Fríos</span>
                    </Link>

                    <div className="flex items-center space-x-1">
                      <Link href="/">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-red-700 hover:text-white">
                          <Home className="h-4 w-4 mr-2" />
                          Inicio
                        </Button>
                      </Link>
                      <Link href="/presupuesto">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-red-700 hover:text-white">
                          <Calculator className="h-4 w-4 mr-2" />
                          Presupuesto
                        </Button>
                      </Link>
                      <Link href="/pedidos">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-red-700 hover:text-white">
                          <FileText className="h-4 w-4 mr-2" />
                          Pedidos
                        </Button>
                      </Link>
                      <Link href="/clientes">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-red-700 hover:text-white">
                          <Users className="h-4 w-4 mr-2" />
                          Clientes
                        </Button>
                      </Link>
                      <Link href="/productos">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-red-700 hover:text-white">
                          <Package className="h-4 w-4 mr-2" />
                          Productos
                        </Button>
                      </Link>
                      <Link href="/ventas">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-red-700 hover:text-white">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Ventas
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </nav>

              <main className="min-h-screen">{children}</main>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
