"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Package } from "lucide-react"
import { supabase, type Producto } from "@/lib/supabase"

interface ProductSearchProps {
    onProductSelect: (producto: Producto) => void
    placeholder?: string
    label?: string
}

export function ProductSearch({
    onProductSelect,
    placeholder = "Buscar producto...",
    label = "Producto",
}: ProductSearchProps) {
    const [query, setQuery] = useState("")
    const [productos, setProductos] = useState<Producto[]>([])
    const [sugerencias, setSugerencias] = useState<Producto[]>([])
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const sugerenciasRef = useRef<HTMLDivElement>(null)

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

    const cargarProductos = async () => {
        try {
            const { data, error } = await supabase.from("productos").select("*").order("nombre")
            console.log("Productos cargados:", data)
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

        // Ordenar por relevancia: primero por código exacto, luego por nombre que empiece con el término
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

        setSugerencias(resultados.slice(0, 8)) // Limitar a 8 resultados
    }

    const seleccionarProducto = (producto: Producto) => {
        onProductSelect(producto)
        setQuery("")
        setSugerencias([])
        setMostrarSugerencias(false)
        setSelectedIndex(-1)
    }

    const manejarTeclado = (e: React.KeyboardEvent) => {
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
                    onKeyDown={manejarTeclado}
                    onFocus={() => {
                        if (query.trim().length >= 2) {
                            setMostrarSugerencias(true)
                        }
                    }}
                    onBlur={() => {
                        // Delay para permitir clicks en sugerencias
                        setTimeout(() => setMostrarSugerencias(false), 200)
                    }}
                    className="pl-10"
                    autoComplete="off"
                />
            </div>

            {mostrarSugerencias && sugerencias.length > 0 && (
                <Card
                    ref={sugerenciasRef}
                    className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg border bg-white"
                >
                    <div className="p-2">
                        {sugerencias.map((producto, index) => (
                            <div
                                key={producto.id}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${index === selectedIndex ? "bg-primary/10 border border-primary/20" : "hover:bg-gray-50"
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
                                                <span className="flex items-center gap-1">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {resaltarTexto(producto.categoria, query)}
                                                    </Badge>
                                                </span>
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

            {mostrarSugerencias && query.trim().length >= 2 && sugerencias.length === 0 && (
                <Card className="absolute z-50 w-full mt-1 shadow-lg border bg-white">
                    <div className="p-4 text-center text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No se encontraron productos</p>
                        <p className="text-sm">Intenta con otro término de búsqueda</p>
                    </div>
                </Card>
            )}
        </div>
    )
}
