"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Package, Plus } from "lucide-react"
import { supabase, type Producto } from "@/lib/supabase"

interface ProductSearchWithQuantityProps {
  onProductAdd: (producto: Producto, cantidad: number) => void
  placeholder?: string
  label?: string
  disabled?: boolean
}

export function ProductSearchWithQuantity({
  onProductAdd,
  placeholder = "Buscar producto...",
  label = "Producto",
  disabled = false,
}: ProductSearchWithQuantityProps) {
  const [query, setQuery] = useState("")
  const [cantidad, setCantidad] = useState("1")
  const [productos, setProductos] = useState<Producto[]>([])
  const [sugerencias, setSugerencias] = useState<Producto[]>([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [mostrarCantidad, setMostrarCantidad] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const cantidadRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    cargarProductos()
  }, [])

  useEffect(() => {
    if (query.trim().length >= 2) {
      filtrarProductos(query)
      setMostrarSugerencias(true)
      setSelectedIndex(-1)
    } else {
      setSugerencias([])
      setMostrarSugerencias(false)
    }
  }, [query, productos])

  // Focus en cantidad cuando se selecciona producto
  useEffect(() => {
    if (mostrarCantidad && cantidadRef.current) {
      cantidadRef.current.focus()
      cantidadRef.current.select()
    }
  }, [mostrarCantidad])

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase.from("productos").select("*").order("nombre")
      if (error) throw error
      setProductos(data || [])
    } catch (error) {
      console.error("Error cargando productos:", error)
    }
  }

  const filtrarProductos = (busqueda: string) => {
    const termino = busqueda.toLowerCase().trim()
    const resultados = productos.filter((producto) => {
      const coincideNombre = producto.nombre.toLowerCase().includes(termino)
      const coincideCodigo = producto.codigo?.toLowerCase().includes(termino)
      const coincideCategoria = producto.categoria?.toLowerCase().includes(termino)
      return coincideNombre || coincideCodigo || coincideCategoria
    })

    resultados.sort((a, b) => {
      const aCodigoExacto = a.codigo?.toLowerCase() === termino
      const bCodigoExacto = b.codigo?.toLowerCase() === termino
      if (aCodigoExacto && !bCodigoExacto) return -1
      if (!aCodigoExacto && bCodigoExacto) return 1

      const aNombreEmpieza = a.nombre.toLowerCase().startsWith(termino)
      const bNombreEmpieza = b.nombre.toLowerCase().startsWith(termino)
      if (aNombreEmpieza && !bNombreEmpieza) return -1
      if (!aNombreEmpieza && bNombreEmpieza) return 1

      return a.nombre.localeCompare(b.nombre)
    })

    setSugerencias(resultados.slice(0, 8))
  }

  const seleccionarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setQuery(producto.nombre)
    setSugerencias([])
    setMostrarSugerencias(false)
    setSelectedIndex(-1)
    setMostrarCantidad(true)
  }

  const agregarProducto = () => {
    if (!productoSeleccionado) return

    const cantidadNum = Number.parseInt(cantidad) || 1
    if (cantidadNum <= 0) return

    onProductAdd(productoSeleccionado, cantidadNum)

    // Limpiar y volver al input de búsqueda
    setQuery("")
    setCantidad("1")
    setProductoSeleccionado(null)
    setMostrarCantidad(false)

    // Focus en el input de búsqueda
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const manejarTecladoBusqueda = (e: React.KeyboardEvent) => {
    if (!mostrarSugerencias || sugerencias.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < sugerencias.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < sugerencias.length) {
          seleccionarProducto(sugerencias[selectedIndex])
        }
        break
      case "Escape":
        setMostrarSugerencias(false)
        setSelectedIndex(-1)
        break
    }
  }

  const manejarTecladoCantidad = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      agregarProducto()
    } else if (e.key === "Escape") {
      cancelarSeleccion()
    }
  }

  const cancelarSeleccion = () => {
    setQuery("")
    setCantidad("1")
    setProductoSeleccionado(null)
    setMostrarCantidad(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const resaltarTexto = (texto: string, busqueda: string) => {
    if (!busqueda.trim()) return texto
    const regex = new RegExp(`(${busqueda.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const partes = texto.split(regex)
    return partes.map((parte, index) =>
      regex.test(parte) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
          {parte}
        </mark>
      ) : (
        parte
      ),
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Label htmlFor="product-search">{label}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            id="product-search"
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={manejarTecladoBusqueda}
            onFocus={() => {
              if (query.trim().length >= 2) {
                setMostrarSugerencias(true)
              }
            }}
            onBlur={() => {
              setTimeout(() => setMostrarSugerencias(false), 200)
            }}
            className="pl-10"
            autoComplete="off"
            disabled={disabled || mostrarCantidad}
          />
        </div>

        {mostrarSugerencias && sugerencias.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg border bg-white">
            <div className="p-2">
              {sugerencias.map((producto, index) => (
                <div
                  key={producto.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex ? "bg-primary/10 border border-primary/20" : "hover:bg-gray-50"
                  }`}
                  onClick={() => seleccionarProducto(producto)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{resaltarTexto(producto.nombre, query)}</span>
                        {producto.codigo && (
                          <Badge variant="outline" className="text-xs">
                            {resaltarTexto(producto.codigo, query)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {producto.categoria && (
                          <Badge variant="secondary" className="text-xs">
                            {resaltarTexto(producto.categoria, query)}
                          </Badge>
                        )}
                        <span>Stock: {producto.stock}</span>
                        <span className="text-green-600 font-medium">
                          Min: ${producto.precio_minorista} | May: ${producto.precio_mayorista}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Input de cantidad */}
      {mostrarCantidad && productoSeleccionado && (
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Producto seleccionado:</span>
              <span>{productoSeleccionado.nombre}</span>
              {productoSeleccionado.codigo && <Badge variant="outline">{productoSeleccionado.codigo}</Badge>}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  ref={cantidadRef}
                  id="cantidad"
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  onKeyDown={manejarTecladoCantidad}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 pt-6">
                <Button
                  onClick={agregarProducto}
                  className="bg-primary hover:bg-red-700"
                  disabled={!cantidad || Number.parseInt(cantidad) <= 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
                <Button variant="outline" onClick={cancelarSeleccion}>
                  Cancelar
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                Stock disponible: <span className="font-medium">{productoSeleccionado.stock}</span>
              </p>
              <p className="text-xs mt-1">💡 Presiona Enter para agregar o Escape para cancelar</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
