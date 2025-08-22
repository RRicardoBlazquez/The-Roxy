import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Clientes = {
  id: string
  nombre: string
  email?: string
  telefono?: string
  direccion?: string
  entre_calles?: string
  deuda: number
  DNI?: number
  tipo: string
  lista: "minorista" | "mayorista"
  alias?: string
  created_at: string
}

export type Producto = {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  stock: number
  precio_minorista: number
  precio_mayorista: number
  categoria?: string
  codigo?: number
  created_at: string
}

export type Presupuesto = {
  id: number
  cliente_id: number
  tipo_cliente: "minorista" | "mayorista"
  subtotal: number
  deuda_anterior: number
  total: number
  estado: "presupuesto" | "pedido" | "vendido"
  fecha_entrega?: string
  created_at: string
}

export type PresupuestoItem = {
  id: string
  presupuesto_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export type Pedidos = {
  id: string
  cliente_id: string
  fecha_entrega?: string
  horario_entrega?: string
  estado: "pendiente" | "entregado" | "cancelado"
  empleado_id: string
  tipo_cliente: "minorista" | "mayorista"
  total: number
}

export type PedidoItem = {
  id: string
  pedidos_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
}

export type VentaItem = {
  id: number
  cliente_id: number
  tipo_cliente: "minorista" | "mayorista"
  subtotal: number
  deuda_anterior: number
  total: number
  created_at: string
  cliente_nombre: string
  direccion?: string
  entre_calles?: string
  telefono?: string
}


export type Ventas = {
  id: string
  cliente_id: string
  fecha: string
  monto_efectivo: number
  monto_tb: number
  total: number
}

export type Detalles_Ventas = {
  id: number
  venta_id: number
  producto_id: number
  cantidad: number
  precio_unitario: number
}

export type empleados = {
  id: number
  nombre: string
  email?: string
  telefono?: string
  direccion?: string
  dni?: number
  created_at: string
  tipo: "administrador" | "vendedor" | "repartidor"
}

export type PedidoDetalle = Pedidos & {
  cliente: Clientes
  items: (PedidoItem & { producto: Producto })[]
}

// Tipos para localStorage
export type PresupuestoLocal = {
  id: string
  cliente: Clientes
  items: {
    producto: Producto
    cantidad: number
    precio_unitario: number
    subtotal: number
  }[]
  subtotal: number
  total: number
  fecha_creacion: string
}