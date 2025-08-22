// Archivo de configuración para verificar la conexión
import { supabase } from "./supabase"

export async function testConnection() {
  try {
    const { data, error } = await supabase.from("clientes").select("count(*)").limit(1)

    if (error) {
      console.error("Error de conexión:", error)
      return false
    }

    console.log("✅ Conexión exitosa a Supabase")
    return true
  } catch (error) {
    console.error("❌ Error de conexión:", error)
    return false
  }
}

export async function checkTables() {
  const tables = ["clientes", "productos", "presupuestos", "presupuesto_items", "ventas"]
  const results = []

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(1)

      if (error) {
        results.push({ table, exists: false, error: error.message })
      } else {
        results.push({ table, exists: true, error: null })
      }
    } catch (error) {
      results.push({ table, exists: false, error: "Error de conexión" })
    }
  }

  return results
}
