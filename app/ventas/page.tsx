"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
//import { AuthGuard } from "@/components/auth-guard"

type VentaDetalle = {
  id: string
  fecha_venta: string
  cliente_nombre: string
  cliente_tipo: string
  cliente_lista?: string
  monto_efectivo?: number
  monto_tb?: number
  total?: number
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<VentaDetalle[]>([])
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Establecer fecha de hoy por defecto
    const hoy = new Date().toISOString().split("T")[0]
    setFechaDesde(hoy)
    setFechaHasta(hoy)
    cargarVentas(hoy, hoy)
  }, [])

  const cargarVentas = async (desde?: string, hasta?: string) => {
    try {
      let query = supabase
        .from("ventas")
        .select(`
          *,
          clientes!inner(nombre, tipo, lista)
        `)
        .order("fecha", { ascending: false })

      if (desde) {
        query = query.gte("fecha", `${desde}T00:00:00`)
      }
      if (hasta) {
        query = query.lte("fecha", `${hasta}T23:59:59`)
      }

      const { data, error } = await query

      if (error) throw error

      const ventasFormateadas: VentaDetalle[] =
        data?.map((venta) => ({
          id: venta.id,
          monto_efectivo: venta.monto_efectivo,
          monto_tb: venta.monto_tb,
          total: venta.total,
          fecha_venta: venta.fecha,
          cliente_nombre: venta.clientes.nombre,
          cliente_tipo: venta.clientes.tipo,
          cliente_lista: venta.clientes.lista,

        })) || []

      setVentas(ventasFormateadas)
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las ventas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filtrarVentas = () => {
    if (!fechaDesde || !fechaHasta) {
      toast({ title: "Error", description: "Selecciona ambas fechas", variant: "destructive" })
      return
    }
    setLoading(true)
    cargarVentas(fechaDesde, fechaHasta)
  }

  const calcularDeuda = (venta: VentaDetalle) => {
    let deuda = 0
    let montoTransferencia = venta.monto_tb || 0
    if (montoTransferencia > 0) {
      montoTransferencia = Math.round((montoTransferencia / 1.03) / 100) * 100 // Redondear a múltiplos de 100
    }
    const montoPagado = (venta.monto_efectivo || 0) + montoTransferencia
    deuda = venta.total ? venta.total - montoPagado : 0

    return deuda
  }

  const calcularTotales = () => {
    const totalVentas = ventas.reduce((sum, venta) => sum + (venta.total || 0), 0)
    const totalCobrado = ventas.reduce((sum, venta) => sum + (venta.monto_efectivo || 0) + (venta.monto_tb || 0), 0)
    const totalDeuda = totalVentas - totalCobrado

    return { totalVentas, totalCobrado, totalDeuda }
  }

  const { totalVentas, totalCobrado, totalDeuda } = calcularTotales()

  if (loading) {
    return (

      <div className="container mx-auto p-6">Cargando ventas...</div>

    )
  }

  return (

    <div className="container mx-auto p-6 min-h-screen bg-gradient-to-br from-red-50 to-yellow-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-primary">Historial de Ventas</h1>
        <p className="text-gray-600">Registro de todas las ventas realizadas</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="fecha-desde">Desde</Label>
              <Input id="fecha-desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="fecha-hasta">Hasta</Label>
              <Input id="fecha-hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
            <Button onClick={filtrarVentas} className="bg-primary hover:bg-red-700">
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Ventas</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalVentas.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary">Total Cobrado</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalCobrado.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Deuda Generada</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalDeuda.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary">Cantidad Ventas</CardTitle>
            <Calendar className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ventas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Ventas</CardTitle>
          <CardDescription>
            {ventas.length} venta{ventas.length !== 1 ? "s" : ""} en el período seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ventas.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay ventas en el período seleccionado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Lista</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Efectivo</TableHead>
                  <TableHead>Transferencia</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell>
                      {new Date(venta.fecha_venta).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{venta.cliente_nombre}</TableCell>
                    <TableCell>
                      <Badge variant={venta.cliente_lista === "mayorista" ? "default" : "secondary"}>
                        {venta.cliente_lista}
                      </Badge>
                    </TableCell>
                    <TableCell>${venta.total}</TableCell>
                    <TableCell>${venta.monto_efectivo}</TableCell>
                    <TableCell>${venta.monto_tb}</TableCell>
                    <TableCell>
                      {(calcularDeuda(venta) < 99) ? (
                        <Badge variant="default" className="bg-green-600">
                          Pagado
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Deuda: ${calcularDeuda(venta)}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>

  )
}
