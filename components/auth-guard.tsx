"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
    children: React.ReactNode
    requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (requireAuth && !user) {
                router.push("/auth/login")
            } else if (!requireAuth && user) {
                router.push("/")
            }
        }
    }, [user, loading, requireAuth, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50">
                <Card className="w-96">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-gray-600">Verificando autenticación...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (requireAuth && !user) {
        return null // El useEffect redirigirá
    }

    if (!requireAuth && user) {
        return null // El useEffect redirigirá
    }

    return <>{children}</>
}
