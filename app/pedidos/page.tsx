"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle, Eye, MapPin, Phone, Clock, DollarSign } from "lucide-react"
import { supabase, type PedidoDetalle } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoDetalle[]>([])
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoDetalle | null>(null)
  const [montoEfectivo, setMontoEfectivo] = useState("")
  const [montoTb, setMontoTb] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogAbierto, setDialogAbierto] = useState(false)

  useEffect(() => {
    cargarPedidos()
  }, [])

  const cargarPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          cliente:clientes(*),
          items:pedidos_item(
            *,
            producto:productos(*)
          )
        `)
        .eq("estado", "pendiente")
        .order("fecha_entrega", { ascending: true })

      console.log("Pedidos cargados:", data)
      if (error) {
        console.error("Error al cargar pedidos:", error)
        throw error
      }

      if (error) throw error

      setPedidos(data || [])
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los pedidos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const abrirDialogoEntrega = (pedido: PedidoDetalle) => {
    setPedidoSeleccionado(pedido)
    setMontoEfectivo(pedido.total.toString())
    setMontoTb("0")
    setDialogAbierto(true)
  }

  const marcarComoEntregado = async () => {
    if (!pedidoSeleccionado) return

    const efectivo = Number.parseInt(montoEfectivo) || 0
    const tb = Number.parseInt(montoTb) || 0
    const valorTb = tb / 1.03
    const totalPagado = efectivo + valorTb

    if (totalPagado <= 0) {
      toast({ title: "Error", description: "Ingresa un monto válido", variant: "destructive" })
      return
    }

    try {
      // Actualizar estado del pedido a entregado
      const { error: errorPedido } = await supabase
        .from("pedidos")
        .update({ estado: "entregado" })
        .eq("id", pedidoSeleccionado.id)

      if (errorPedido) throw errorPedido

      // Crear registro de venta
      const { error: errorVenta } = await supabase.from("ventas").insert({
        cliente_id: pedidoSeleccionado.cliente_id,
        fecha: new Date().toISOString(),
        monto_efectivo: efectivo,
        monto_tb: tb,
        total: pedidoSeleccionado.total,
      })

      if (errorVenta) throw errorVenta

      // Actualizar deuda del cliente
      const diferencia = pedidoSeleccionado.total - totalPagado
      let nuevaDeuda = 0

      if (diferencia > 99 || diferencia < -99) {
        // El cliente debe dinero - aumentar deuda
        nuevaDeuda += diferencia
      }
      const { error: errorDeuda } = await supabase
        .from("clientes")
        .update({ deuda: nuevaDeuda })
        .eq("id", pedidoSeleccionado.cliente_id)

      if (errorDeuda) throw errorDeuda


      toast({
        title: "Éxito",
        description: `Pedido entregado. ${diferencia > 0 ? `Deuda pendiente: $${diferencia}` : diferencia < 0 ? `Sobrepago aplicado: $${Math.abs(diferencia)}` : "Pago completo"}`,
      })

      setDialogAbierto(false)
      setPedidoSeleccionado(null)
      setMontoEfectivo("")
      setMontoTb("")
      cargarPedidos()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo procesar la entrega", variant: "destructive" })
    }
  }

  if (loading) {
    return <div className="container mx-auto p-6">Cargando pedidos...</div>
  }

  return (

    <div className="container mx-auto p-4 sm:p-6 min-h-screen bg-gradient-to-br from-red-50 to-yellow-50">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-primary">Pedidos Pendientes</h1>
        <p className="text-gray-600 text-sm sm:text-base">Gestionar entregas de pedidos</p>
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No hay pedidos pendientes</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pedidos</CardTitle>
            <CardDescription>
              {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} pendiente{pedidos.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Entrega</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="hidden md:table-cell">Dirección</TableHead>
                    <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{pedido.cliente.nombre}</div>
                          <Badge
                            variant={pedido.cliente.tipo === "mayorista" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {pedido.cliente.tipo}
                          </Badge>
                          {pedido.cliente.deuda > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Deuda: ${pedido.cliente.deuda}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="space-y-1">
                          {pedido.fecha_entrega && (
                            <div className="text-sm">{new Date(pedido.fecha_entrega).toISOString().split('T')[0]}</div>
                          )}
                          {pedido.horario_entrega && (
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {pedido.horario_entrega}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">${pedido.total}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {pedido.cliente.direccion && (
                          <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                            <div>
                              <div className="text-sm">{pedido.cliente.direccion}</div>
                              {pedido.cliente.entre_calles && (
                                <div className="text-xs text-gray-600">{pedido.cliente.entre_calles}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {pedido.cliente.telefono && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{pedido.cliente.telefono}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          {pedido.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPedidoSeleccionado(pedido)}
                                className="border-secondary text-secondary-600 hover:bg-secondary hover:text-gray-800"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalle del Pedido</DialogTitle>
                                <DialogDescription>Información completa del pedido</DialogDescription>
                              </DialogHeader>

                              {pedidoSeleccionado && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Cliente</Label>
                                      <p className="font-medium">{pedidoSeleccionado.cliente.nombre}</p>
                                    </div>
                                    <div>
                                      <Label>Tipo</Label>
                                      <Badge
                                        variant={
                                          pedidoSeleccionado.cliente.tipo === "mayorista" ? "default" : "secondary"
                                        }
                                      >
                                        {pedidoSeleccionado.cliente.tipo}
                                      </Badge>
                                    </div>
                                    <div>
                                      <Label>Fecha de Entrega</Label>
                                      <p>
                                        {pedidoSeleccionado.fecha_entrega
                                          ? new Date(pedidoSeleccionado.fecha_entrega).toLocaleDateString()
                                          : "No especificada"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Horario</Label>
                                      <p>{pedidoSeleccionado.horario_entrega || "No especificado"}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Productos</Label>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Producto</TableHead>
                                          <TableHead>Cantidad</TableHead>
                                          <TableHead>Precio</TableHead>
                                          <TableHead>Subtotal</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {pedidoSeleccionado.items.map((item) => (
                                          <TableRow key={item.id}>
                                            <TableCell>{item.producto.nombre}</TableCell>
                                            <TableCell>{item.cantidad}</TableCell>
                                            <TableCell>${item.precio_unitario}</TableCell>
                                            <TableCell>${(item.cantidad * item.precio_unitario).toFixed(2)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>

                                  <div className="p-4 bg-muted rounded-lg">
                                    <div className="flex justify-between font-bold">
                                      <span>Total:</span>
                                      <span>${pedidoSeleccionado.total}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            onClick={() => abrirDialogoEntrega(pedido)}
                            className="bg-primary hover:bg-red-700"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para marcar como entregado */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Entregado</DialogTitle>
            <DialogDescription>Registrar el pago del cliente</DialogDescription>
          </DialogHeader>

          {pedidoSeleccionado && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Cliente:</span>
                  <span>{pedidoSeleccionado.cliente.nombre}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total del pedido:</span>
                  <span className="font-bold text-lg">${pedidoSeleccionado.total}</span>
                </div>
                {pedidoSeleccionado.cliente.deuda > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="font-medium">Deuda anterior:</span>
                    <span>${pedidoSeleccionado.cliente.deuda}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monto-efectivo">Monto en Efectivo</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="monto-efectivo"
                      type="number"
                      step="0.01"
                      value={montoEfectivo}
                      onChange={(e) => setMontoEfectivo(e.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="monto-tb">Monto Transferencia/Débito</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="monto-tb"
                      type="number"
                      step="0.01"
                      value={montoTb}
                      onChange={(e) => setMontoTb(e.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total pagado:</span>
                  <span className="font-medium">
                    ${((Number.parseFloat(montoEfectivo) || 0) + (Number.parseFloat(montoTb / 1.03) || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Diferencia:</span>
                  <span
                    className={`font-medium ${pedidoSeleccionado.total -
                      ((Number.parseFloat(montoEfectivo) || 0) + (Number.parseFloat(montoTb / 1.03) || 0)) >
                      0
                      ? "text-red-600"
                      : pedidoSeleccionado.total -
                        ((Number.parseFloat(montoEfectivo) || 0) + (Number.parseFloat(montoTb / 1.03) || 0)) <
                        0
                        ? "text-green-600"
                        : "text-gray-600"
                      }`}
                  >
                    $
                    {(
                      pedidoSeleccionado.total -
                      ((Number.parseFloat(montoEfectivo) || 0) + (Number.parseFloat(montoTb / 1.03) || 0))
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={marcarComoEntregado} className="flex-1 bg-primary hover:bg-red-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Entrega
                </Button>
                <Button variant="outline" onClick={() => setDialogAbierto(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
