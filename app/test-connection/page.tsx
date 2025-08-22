"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Database, RefreshCw } from "lucide-react"
import { testConnection, checkTables } from "@/lib/supabase-config"

type TableStatus = {
  table: string
  exists: boolean
  error: string | null
}

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null)
  const [tablesStatus, setTablesStatus] = useState<TableStatus[]>([])
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)

    // Test connection
    const connected = await testConnection()
    setConnectionStatus(connected)

    // Check tables
    if (connected) {
      const tables = await checkTables()
      setTablesStatus(tables)
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gradient-to-br from-red-50 to-yellow-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-primary">Test de Conexión a Supabase</h1>
        <p className="text-gray-600">Verificar la conexión y estructura de la base de datos</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Estado de la Conexión
            </CardTitle>
            <CardDescription>Verificar si la aplicación puede conectarse a Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {connectionStatus === null ? (
                  <Badge variant="outline">No probado</Badge>
                ) : connectionStatus ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <Badge variant="default" className="bg-green-600">
                      Conectado
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <Badge variant="destructive">Error de conexión</Badge>
                  </>
                )}
              </div>
              <Button onClick={runTests} disabled={loading} className="bg-primary hover:bg-red-700">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Probando...
                  </>
                ) : (
                  "Probar Conexión"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {tablesStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Estado de las Tablas</CardTitle>
              <CardDescription>Verificar que todas las tablas necesarias existan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tablesStatus.map((table) => (
                  <div key={table.table} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {table.exists ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">{table.table}</span>
                    </div>
                    <div>
                      {table.exists ? (
                        <Badge variant="default" className="bg-green-600">
                          Existe
                        </Badge>
                      ) : (
                        <Badge variant="destructive">No existe</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {tablesStatus.some((t) => !t.exists) && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Algunas tablas no existen.</strong> Ejecuta el script SQL "create-missing-tables.sql" en
                    el SQL Editor de Supabase para crear las tablas faltantes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones de Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Configurar Variables de Entorno</h3>
              <p className="text-sm text-gray-600 mb-2">
                Crea un archivo <code className="bg-gray-100 px-1 rounded">.env.local</code> en la raíz del proyecto:
              </p>
              <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
                <br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Obtener las Credenciales</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • Ve a tu proyecto en{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    className="text-primary hover:underline"
                    rel="noreferrer"
                  >
                    Supabase Dashboard
                  </a>
                </li>
                <li>• Navega a Settings → API</li>
                <li>• Copia la "Project URL" y la "anon public" key</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Verificar/Crear Tablas</h3>
              <p className="text-sm text-gray-600">
                Ejecuta los scripts SQL proporcionados en el SQL Editor de Supabase para crear las tablas necesarias.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
