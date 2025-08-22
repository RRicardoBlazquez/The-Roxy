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
import { Plus, Edit, Trash2, Package, AlertTriangle, Search, X } from "lucide-react"
import { supabase, type Producto } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [loading, setLoading] = useState(true)

  // Formulario
  const [nombre, setNombre] = useState("")
  const [precioMinorista, setPrecioMinorista] = useState("")
  const [precioMayorista, setPrecioMayorista] = useState("")
  const [stock, setStock] = useState("")
  const [categoria, setCategoria] = useState("")

  // Agregar estos estados después de los estados existentes
  const [busqueda, setBusqueda] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("")
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([])

  useEffect(() => {
    cargarProductos()
  }, [])

  // Agregar este useEffect después del useEffect existente
  useEffect(() => {
    let resultados = productos

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      resultados = resultados.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          (producto.categoria && producto.categoria.toLowerCase().includes(busqueda.toLowerCase())),
      )
    }

    // Filtrar por categoría
    if (categoriaFiltro && categoriaFiltro !== "todas") {
      resultados = resultados.filter((producto) => producto.categoria === categoriaFiltro)
    }

    setProductosFiltrados(resultados)
  }, [productos, busqueda, categoriaFiltro])

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase.from("productos").select("*").order("nombre")

      if (error) throw error

      setProductos(data || [])
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los productos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const limpiarFormulario = () => {
    setNombre("")
    setPrecioMinorista("")
    setPrecioMayorista("")
    setStock("")
    setCategoria("")
    setProductoEditando(null)
  }

  const abrirDialogoNuevo = () => {
    limpiarFormulario()
    setDialogAbierto(true)
  }

  const abrirDialogoEditar = (producto: Producto) => {
    setProductoEditando(producto)
    setNombre(producto.nombre)
    setPrecioMinorista(producto.precio_minorista.toString())
    setPrecioMayorista(producto.precio_mayorista.toString())
    setStock(producto.stock.toString())
    setCategoria(producto.categoria || "")
    setDialogAbierto(true)
  }

  const guardarProducto = async () => {
    if (!nombre.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" })
      return
    }

    const precioMin = Number.parseFloat(precioMinorista)
    const precioMay = Number.parseFloat(precioMayorista)
    const stockNum = Number.parseInt(stock) || 0

    if (isNaN(precioMin) || precioMin <= 0) {
      toast({ title: "Error", description: "El precio minorista debe ser mayor a 0", variant: "destructive" })
      return
    }

    if (isNaN(precioMay) || precioMay <= 0) {
      toast({ title: "Error", description: "El precio mayorista debe ser mayor a 0", variant: "destructive" })
      return
    }

    try {
      if (productoEditando) {
        // Actualizar producto existente
        const { error } = await supabase
          .from("productos")
          .update({
            nombre: nombre.trim(),
            precio_minorista: precioMin,
            precio_mayorista: precioMay,
            stock: stockNum,
            categoria: categoria.trim() || null,
          })
          .eq("id", productoEditando.id)

        if (error) throw error

        toast({ title: "Éxito", description: "Producto actualizado correctamente" })
      } else {
        // Crear nuevo producto
        const { error } = await supabase.from("productos").insert({
          nombre: nombre.trim(),
          precio_minorista: precioMin,
          precio_mayorista: precioMay,
          stock: stockNum,
          categoria: categoria.trim() || null,
        })

        if (error) throw error

        toast({ title: "Éxito", description: "Producto creado correctamente" })
      }

      setDialogAbierto(false)
      limpiarFormulario()
      cargarProductos()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el producto", variant: "destructive" })
    }
  }

  const eliminarProducto = async (producto: Producto) => {
    if (!confirm(`¿Estás seguro de eliminar ${producto.nombre}?`)) return

    try {
      const { error } = await supabase.from("productos").delete().eq("id", producto.id)

      if (error) throw error

      toast({ title: "Éxito", description: "Producto eliminado correctamente" })
      cargarProductos()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el producto", variant: "destructive" })
    }
  }

  const obtenerCategorias = () => {
    const categorias = productos
      .map((p) => p.categoria)
      .filter((cat) => cat && cat.trim() !== "")
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
      .sort()

    return categorias
  }

  const limpiarFiltros = () => {
    setBusqueda("")
    setCategoriaFiltro("")
  }

  if (loading) {
    return <div className="container mx-auto p-6">Cargando productos...</div>
  }

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gradient-to-br from-red-50 to-yellow-50">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-primary">Gestión de Productos</h1>
          <p className="text-gray-600">Administrar inventario y precios</p>
        </div>
        <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogoNuevo} className="bg-secondary hover:bg-yellow-500 text-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{productoEditando ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              <DialogDescription>
                {productoEditando ? "Modifica la información del producto" : "Ingresa los datos del nuevo producto"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del producto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="precio-minorista">Precio Minorista *</Label>
                  <Input
                    id="precio-minorista"
                    type="number"
                    step="0.01"
                    value={precioMinorista}
                    onChange={(e) => setPrecioMinorista(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="precio-mayorista">Precio Mayorista *</Label>
                  <Input
                    id="precio-mayorista"
                    type="number"
                    step="0.01"
                    value={precioMayorista}
                    onChange={(e) => setPrecioMayorista(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej: Helados, Pizzas, Carnes"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={guardarProducto} className="flex-1 bg-secondary hover:bg-yellow-500 text-gray-800">
                  {productoEditando ? "Actualizar" : "Crear"} Producto
                </Button>
                <Button variant="outline" onClick={() => setDialogAbierto(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sección de Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar y Filtrar Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="busqueda">Buscar productos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="busqueda"
                  type="text"
                  placeholder="Buscar por nombre o categoría..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="md:w-64">
              <Label htmlFor="categoria-filtro">Filtrar por categoría</Label>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {obtenerCategorias().map((categoria) => (
                    <SelectItem key={categoria} value={categoria || ""}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={limpiarFiltros}
                className="border-secondary text-secondary-600 hover:bg-secondary hover:text-gray-800 bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>

          {(busqueda || categoriaFiltro) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <span>
                Mostrando {productosFiltrados.length} de {productos.length} productos
              </span>
              {busqueda && (
                <Badge variant="outline" className="gap-1">
                  Búsqueda: "{busqueda}"
                  <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => setBusqueda("")} />
                </Badge>
              )}
              {categoriaFiltro && categoriaFiltro !== "todas" && (
                <Badge variant="outline" className="gap-1">
                  Categoría: {categoriaFiltro}
                  <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => setCategoriaFiltro("")} />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
          <CardDescription>
            {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""}
            {busqueda || categoriaFiltro
              ? " encontrado" + (productosFiltrados.length !== 1 ? "s" : "")
              : " registrado" + (productosFiltrados.length !== 1 ? "s" : "")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {productos.length === 0
                  ? "No hay productos registrados"
                  : "No se encontraron productos con los filtros aplicados"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio Minorista</TableHead>
                  <TableHead>Precio Mayorista</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>
                      {producto.categoria ? (
                        <Badge variant="outline">{producto.categoria}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>${producto.precio_minorista}</TableCell>
                    <TableCell>${producto.precio_mayorista}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {producto.stock}
                        {producto.stock <= 5 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => abrirDialogoEditar(producto)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => eliminarProducto(producto)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
