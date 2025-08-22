"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Calendar, Plus, Minus, Save } from "lucide-react"
import { supabase, type Clientes, type Producto, type PresupuestoLocal } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { ProductSearchWithQuantity } from "@/components/product-search-with-quantity"


type ItemPresupuesto = {
  producto: Producto
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export default function PresupuestoPage() {
  const [clientes, setClientes] = useState<Clientes[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Clientes | null>(null)
  const [items, setItems] = useState<ItemPresupuesto[]>([])
  const [fechaEntrega, setFechaEntrega] = useState("")
  const [horarioEntrega, setHorarioEntrega] = useState("")
  const [presupuestosGuardados, setPresupuestosGuardados] = useState<PresupuestoLocal[]>([])

  useEffect(() => {
    cargarClientes()
    cargarPresupuestosLocales()
  }, [])

  const cargarClientes = async () => {
    const { data, error } = await supabase.from("clientes").select("*").order("nombre")
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los clientes", variant: "destructive" })
    } else {
      setClientes(data || [])
    }
  }

  const cargarPresupuestosLocales = () => {
    try {
      const presupuestos = localStorage.getItem("presupuestos")
      if (presupuestos) {
        setPresupuestosGuardados(JSON.parse(presupuestos))
      }
    } catch (error) {
      console.error("Error cargando presupuestos:", error)
    }
  }

  const agregarProducto = (producto: Producto, cantidad: number) => {
    if (!clienteSeleccionado) {
      toast({ title: "Error", description: "Selecciona un cliente primero", variant: "destructive" })
      return
    }

    // Verificar si el producto ya está en la lista
    const itemExistente = items.find((item) => item.producto.id === producto.id)
    const precio = clienteSeleccionado.lista === "mayorista" ? producto.precio_mayorista : producto.precio_minorista

    if (itemExistente) {
      // Si ya existe, actualizar la cantidad
      const nuevaCantidad = itemExistente.cantidad + cantidad
      actualizarCantidad(items.indexOf(itemExistente), nuevaCantidad)
      toast({
        title: "Producto actualizado",
        description: `Se agregaron ${cantidad} unidades de ${producto.nombre}`,
        duration: 2000,
      })
    } else {
      // Si no existe, agregarlo
      const nuevoItem: ItemPresupuesto = {
        producto,
        cantidad,
        precio_unitario: precio,
        subtotal: precio * cantidad,
      }

      setItems([...items, nuevoItem])
      toast({
        title: "Producto agregado",
        description: `${producto.nombre} (${cantidad} unidades) agregado al presupuesto`,
        duration: 2000,
      })
    }
  }

  const actualizarCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarItem(index)
      return
    }

    if (!clienteSeleccionado) return

    const item = items[index]
    const itemsActualizados = [...items]
    itemsActualizados[index] = {
      ...item,
      cantidad: nuevaCantidad,
      subtotal: item.precio_unitario * nuevaCantidad,
    }

    setItems(itemsActualizados)
  }

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calcularSubtotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const calcularTotal = () => {
    const subtotal = calcularSubtotal()
    const deuda = clienteSeleccionado?.deuda || 0
    return subtotal + deuda
  }

  const guardarPresupuesto = () => {
    if (!clienteSeleccionado || items.length === 0) {
      toast({ title: "Error", description: "Selecciona un cliente y agrega productos", variant: "destructive" })
      return
    }

    const presupuesto: PresupuestoLocal = {
      id: Date.now().toString(),
      cliente: clienteSeleccionado,
      items: items.map((item) => ({
        producto: item.producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      })),
      subtotal: calcularSubtotal(),
      total: calcularTotal(),
      fecha_creacion: new Date().toISOString(),
    }

    try {
      const presupuestosExistentes = JSON.parse(localStorage.getItem("presupuestos") || "[]")
      const nuevosPresupuestos = [...presupuestosExistentes, presupuesto]
      localStorage.setItem("presupuestos", JSON.stringify(nuevosPresupuestos))

      setPresupuestosGuardados(nuevosPresupuestos)
      toast({ title: "Éxito", description: "Presupuesto guardado localmente" })

      // Limpiar formulario
      limpiarFormulario()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el presupuesto", variant: "destructive" })
    }
  }

  const guardarPedido = async () => {
    if (!clienteSeleccionado || items.length === 0) {
      toast({ title: "Error", description: "Selecciona un cliente y agrega productos", variant: "destructive" })
      return
    }

    try {
      // Crear pedido
      const { data: pedido, error: errorPedido } = await supabase
        .from("pedidos")
        .insert({
          cliente_id: clienteSeleccionado.id,
          fecha_entrega: fechaEntrega || null,
          horario_entrega: horarioEntrega || null,
          estado: "pendiente",
          total: calcularTotal(),
        })
        .select()
        .single()

      if (errorPedido) throw errorPedido

      // Crear items del pedido
      const itemsData = items.map((item) => ({
        pedidos_id: pedido.id,
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      }))

      const { error: errorItems } = await supabase.from("pedidos_item").insert(itemsData)
      if (errorItems) throw errorItems

      // Actualizar stock (permitir negativo)
      for (const item of items) {
        const nuevoStock = item.producto.stock - item.cantidad
        const { error: errorStock } = await supabase
          .from("productos")
          .update({ stock: nuevoStock })
          .eq("id", item.producto.id)

        if (errorStock) throw errorStock
      }

      toast({ title: "Éxito", description: "Pedido guardado correctamente" })
      limpiarFormulario()
    } catch (error) {
      console.error("Error guardando pedido:", error)
      toast({ title: "Error", description: "No se pudo guardar el pedido", variant: "destructive" })
    }
  }

  const limpiarFormulario = () => {
    setClienteSeleccionado(null)
    setItems([])
    setFechaEntrega("")
    setHorarioEntrega("")
  }

  const cargarPresupuesto = (presupuesto: PresupuestoLocal) => {
    setClienteSeleccionado(presupuesto.cliente)
    setItems(
      presupuesto.items.map((item) => ({
        producto: item.producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      })),
    )
    toast({ title: "Presupuesto cargado", description: "Presupuesto cargado desde localStorage" })
  }

  const eliminarPresupuesto = (id: string) => {
    try {
      const nuevosPresupuestos = presupuestosGuardados.filter((p) => p.id !== id)
      localStorage.setItem("presupuestos", JSON.stringify(nuevosPresupuestos))
      setPresupuestosGuardados(nuevosPresupuestos)
      toast({ title: "Presupuesto eliminado", description: "Presupuesto eliminado del localStorage" })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el presupuesto", variant: "destructive" })
    }
  }

  return (

    <div className="container mx-auto p-4 sm:p-6 min-h-screen bg-gradient-to-br from-red-50 to-yellow-50">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-primary">Nuevo Presupuesto</h1>
        <p className="text-gray-600 text-sm sm:text-base">Crear presupuesto para cliente</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Información del Cliente y Búsqueda de Productos */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cliente" className="text-sm font-medium">
                  Cliente
                </Label>
                <Select
                  onValueChange={(value) => {
                    const cliente = clientes.find((c) => c.id === value)
                    setClienteSeleccionado(cliente || null)
                  }}
                  value={clienteSeleccionado?.id || ""}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span>{cliente.nombre}</span>
                          <Badge variant="outline" className="text-xs">
                            {cliente.tipo}
                          </Badge>
                          {cliente.deuda > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Deuda: ${cliente.deuda}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {clienteSeleccionado && (
                <div className="p-3 sm:p-4 bg-muted rounded-lg space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p>
                      <strong>Tipo:</strong> {clienteSeleccionado.tipo}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {clienteSeleccionado.telefono || "N/A"}
                    </p>
                  </div>
                  <p className="text-sm">
                    <strong>Dirección:</strong> {clienteSeleccionado.direccion || "N/A"}
                  </p>
                  {clienteSeleccionado.deuda > 0 && (
                    <p className="text-red-600 text-sm font-medium">
                      <strong>Deuda anterior:</strong> ${clienteSeleccionado.deuda}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha-entrega" className="text-sm font-medium">
                    Fecha de Entrega
                  </Label>
                  <Input
                    id="fecha-entrega"
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="horario-entrega" className="text-sm font-medium">
                    Horario de Entrega
                  </Label>
                  <Input
                    id="horario-entrega"
                    type="time"
                    value={horarioEntrega}
                    onChange={(e) => setHorarioEntrega(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buscar Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Buscar Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSearchWithQuantity
                onProductAdd={agregarProducto}
                placeholder="Escribe el nombre o código del producto..."
                label="Buscar producto"
                disabled={!clienteSeleccionado}
              />

              {!clienteSeleccionado && (
                <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                  <AlertDescription className="text-yellow-800 text-sm">
                    Selecciona un cliente antes de buscar productos
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Presupuestos Guardados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Save className="h-5 w-5" />
              Presupuestos Guardados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {presupuestosGuardados.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay presupuestos guardados</p>
            ) : (
              <div className="space-y-2">
                {presupuestosGuardados.map((presupuesto) => (
                  <div key={presupuesto.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{presupuesto.cliente.nombre}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(presupuesto.fecha_creacion).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ${presupuesto.total}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cargarPresupuesto(presupuesto)}
                        className="text-xs"
                      >
                        Cargar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => eliminarPresupuesto(presupuesto.id)}
                        className="text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productos Seleccionados */}
      {items.length > 0 && (
        <Card className="mt-4 sm:mt-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Productos Seleccionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Producto</TableHead>
                    <TableHead className="hidden sm:table-cell">Código</TableHead>
                    <TableHead className="min-w-[120px]">Cantidad</TableHead>
                    <TableHead className="hidden md:table-cell">Precio Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={`${item.producto.id}-${index}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{item.producto.nombre}</div>
                          {item.producto.categoria && (
                            <Badge variant="outline" className="text-xs">
                              {item.producto.categoria}
                            </Badge>
                          )}
                          <div className="md:hidden text-xs text-gray-600">${item.precio_unitario} c/u</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {item.producto.codigo && <Badge variant="secondary">{item.producto.codigo}</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => actualizarCantidad(index, item.cantidad - 1)}
                            disabled={item.cantidad <= 1}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm">{item.cantidad}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => actualizarCantidad(index, item.cantidad + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Stock: {item.producto.stock}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">${item.precio_unitario}</TableCell>
                      <TableCell className="font-medium">${item.subtotal}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => eliminarItem(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Resumen */}
            <div className="mt-4 p-3 sm:p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span>Subtotal:</span>
                  <span className="font-medium">${calcularSubtotal()}</span>
                </div>
                {clienteSeleccionado?.deuda && clienteSeleccionado.deuda > 0 && (
                  <div className="flex justify-between items-center text-red-600 text-sm sm:text-base">
                    <span>Deuda anterior:</span>
                    <span className="font-medium">${clienteSeleccionado.deuda}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${calcularTotal()}</span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
              <Button
                onClick={guardarPresupuesto}
                variant="outline"
                className="border-secondary text-secondary-600 hover:bg-secondary hover:text-gray-800 w-full sm:w-auto bg-transparent"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Presupuesto
              </Button>
              <Button onClick={guardarPedido} className="bg-primary hover:bg-red-700 w-full sm:w-auto">
                <Calendar className="h-4 w-4 mr-2" />
                Guardar como Pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>

  )
}
