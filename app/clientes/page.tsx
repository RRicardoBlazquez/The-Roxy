"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Edit, Trash2, User } from "lucide-react"
import { supabase, type Clientes } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { set } from "date-fns"
//import { AuthGuard } from "@/components/auth-guard"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Clientes[]>([])
  const [clienteEditando, setClienteEditando] = useState<Clientes | null>(null)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [loading, setLoading] = useState(true)

  // Formulario
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [tipo, setTipo] = useState("")
  const [lista, setLista] = useState<"minorista" | "mayorista">("minorista")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [entreCalles, setEntreCalles] = useState("")
  const [deuda, setDeuda] = useState("")
  const [dni, setDni] = useState("")

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase.from("clientes").select("*").order("nombre")

      if (error) throw error

      setClientes(data || [])
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los clientes", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const limpiarFormulario = () => {
    setNombre("")
    setEmail("")
    setLista("minorista")
    setTipo("")
    setTelefono("")
    setDireccion("")
    setEntreCalles("")
    setDeuda("")
    setDni("")
    setClienteEditando(null)
  }

  const abrirDialogoNuevo = () => {
    limpiarFormulario()
    setDialogAbierto(true)
  }

  const abrirDialogoEditar = (cliente: Clientes) => {
    setClienteEditando(cliente)
    setNombre(cliente.nombre)
    setEmail(cliente.email || "")
    setLista(cliente.lista || "minorista")
    setTipo(cliente.tipo)
    setTelefono(cliente.telefono || "")
    setDireccion(cliente.direccion || "")

    setEntreCalles(cliente.entre_calles || "")
    setDeuda(cliente.deuda.toString())
    setDialogAbierto(true)
  }

  const guardarCliente = async () => {
    if (!nombre.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" })
      return
    }

    const deudaNum = Number.parseFloat(deuda) || 0
    const documentoDNI = dni ? Number.parseInt(dni) : null
    try {
      if (clienteEditando) {
        // Actualizar cliente existente
        const { error } = await supabase
          .from("clientes")
          .update({
            nombre: nombre.trim(),
            email: email.trim() || null,
            lista,
            tipo: tipo.trim() || null,
            telefono: telefono.trim() || null,
            direccion: direccion.trim() || null,
            entre_calles: entreCalles.trim() || null,
            deuda: deudaNum,
            dni: documentoDNI,
          })
          .eq("id", clienteEditando.id)

        if (error) throw error

        toast({ title: "Éxito", description: "Cliente actualizado correctamente" })
      } else {
        // Crear nuevo cliente
        const { error } = await supabase.from("clientes").insert({
          nombre: nombre.trim(),
          email: email.trim() || null,
          lista,
          tipo: tipo.trim() || null,
          telefono: telefono.trim() || null,
          direccion: direccion.trim() || null,
          entre_calles: entreCalles.trim() || null,
          deuda: deudaNum,
          dni: documentoDNI,
        })

        if (error) throw error

        toast({ title: "Éxito", description: "Cliente creado correctamente" })
      }

      setDialogAbierto(false)
      limpiarFormulario()
      cargarClientes()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el cliente", variant: "destructive" })
    }
  }

  const eliminarCliente = async (cliente: Clientes) => {
    if (!confirm(`¿Estás seguro de eliminar a ${cliente.nombre}?`)) return

    try {
      const { error } = await supabase.from("clientes").delete().eq("id", cliente.id)

      if (error) throw error

      toast({ title: "Éxito", description: "Cliente eliminado correctamente" })
      cargarClientes()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el cliente", variant: "destructive" })
    }
  }

  if (loading) {
    return <div className="container mx-auto p-6">Cargando clientes...</div>
  }

  return (

    <div className="container mx-auto p-6 min-h-screen bg-gradient-to-br from-red-50 to-yellow-50">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-primary">Gestión de Clientes</h1>
          <p className="text-gray-600">Administrar información de clientes</p>
        </div>
        <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogoNuevo} className="bg-primary hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{clienteEditando ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
              <DialogDescription>
                {clienteEditando ? "Modifica la información del cliente" : "Ingresa los datos del nuevo cliente"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de Cliente </Label>
                <Input
                  id="nombre"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  placeholder="kiosco, almacén, etc."
                />
              </div>

              <div>
                <Label htmlFor="lista">Lista de Cliente *</Label>
                <Select value={lista} onValueChange={(value: "minorista" | "mayorista") => setLista(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minorista">Minorista</SelectItem>
                    <SelectItem value="mayorista">Mayorista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Número de teléfono"
                />
              </div>

              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección del cliente"
                />
              </div>

              <div>
                <Label htmlFor="entre-calles">Entre Calles</Label>
                <Input
                  id="entre-calles"
                  value={entreCalles}
                  onChange={(e) => setEntreCalles(e.target.value)}
                  placeholder="Entre qué calles se encuentra"
                />
              </div>

              <div>
                <Label htmlFor="deuda">Deuda</Label>
                <Input
                  id="deuda"
                  type="number"
                  step="0.01"
                  value={deuda}
                  onChange={(e) => setDeuda(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={guardarCliente} className="flex-1 bg-primary hover:bg-red-700">
                  {clienteEditando ? "Actualizar" : "Crear"} Cliente
                </Button>
                <Button variant="outline" onClick={() => setDialogAbierto(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientes.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay clientes registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Deuda</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nombre}</TableCell>
                    <TableCell>
                      <Badge variant={cliente.tipo === "mayorista" ? "default" : "secondary"}>{cliente.tipo}</Badge>
                    </TableCell>
                    <TableCell>{cliente.telefono || "-"}</TableCell>
                    <TableCell>
                      <div>
                        <div>{cliente.direccion || "-"}</div>
                        {cliente.entre_calles && (
                          <div className="text-sm text-muted-foreground">{cliente.entre_calles}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cliente.deuda > 0 ? (
                        <Badge variant="destructive">${cliente.deuda}</Badge>
                      ) : (
                        <span className="text-muted-foreground">$0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => abrirDialogoEditar(cliente)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => eliminarCliente(cliente)}>
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
