import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, Package, Users, ShoppingCart, FileText, TrendingUp } from "lucide-react"






export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">The Roxy cobos</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema completo para la gestión de tu negocio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Calculator className="h-6 w-6" />
                Nuevo Presupuesto
              </CardTitle>
              <CardDescription>Crear presupuestos para clientes minoristas y mayoristas</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/presupuesto">
                <Button className="w-full bg-primary hover:bg-red-700 text-white">Crear Presupuesto</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary-600">
                <FileText className="h-6 w-6" />
                Pedidos del Día
              </CardTitle>
              <CardDescription>Ver y gestionar los pedidos programados para hoy</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/pedidos">
                <Button className="w-full bg-secondary hover:bg-yellow-500 text-gray-800">Ver Pedidos</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Users className="h-6 w-6" />
                Clientes
              </CardTitle>
              <CardDescription>Gestionar información de clientes y deudas</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/clientes">
                <Button className="w-full bg-primary hover:bg-red-700 text-white">Gestionar Clientes</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary-600">
                <Package className="h-6 w-6" />
                Productos
              </CardTitle>
              <CardDescription>Administrar inventario y precios de productos</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/productos">
                <Button className="w-full bg-secondary hover:bg-yellow-500 text-gray-800">Ver Productos</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ShoppingCart className="h-6 w-6" />
                Ventas
              </CardTitle>
              <CardDescription>Historial de ventas y facturación</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ventas">
                <Button className="w-full bg-primary hover:bg-red-700 text-white">Ver Ventas</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary-600">
                <TrendingUp className="h-6 w-6" />
                Reportes
              </CardTitle>
              <CardDescription>Análisis de ventas y estadísticas del negocio</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/reportes">
                <Button className="w-full bg-secondary hover:bg-yellow-500 text-gray-800">Ver Reportes</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
