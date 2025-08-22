"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import { toast } from "@/hooks/use-toast"

type Perfil = {
    id: string
    nombre: string
    email: string
    rol: "admin" | "usuario"
    activo: boolean
}

type AuthContextType = {
    user: User | null
    perfil: Perfil | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<boolean>
    signUp: (email: string, password: string, nombre: string) => Promise<boolean>
    signOut: () => Promise<void>
    updateProfile: (data: Partial<Perfil>) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Obtener sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                cargarPerfil(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Escuchar cambios de autenticación
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                await cargarPerfil(session.user.id)
            } else {
                setPerfil(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const cargarPerfil = async (userId: string) => {
        try {
            const { data, error } = await supabase.from("perfiles").select("*").eq("id", userId).single()

            if (error) {
                console.error("Error cargando perfil:", error)
                // Si no existe el perfil, crearlo
                if (error.code === "PGRST116") {
                    await crearPerfil(userId)
                }
            } else {
                setPerfil(data)
            }
        } catch (error) {
            console.error("Error cargando perfil:", error)
        } finally {
            setLoading(false)
        }
    }

    const crearPerfil = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("perfiles")
                .insert({
                    id: userId,
                    email: user?.email || "",
                    nombre: user?.user_metadata?.nombre || user?.email?.split("@")[0] || "Usuario",
                })
                .select()
                .single()

            if (error) throw error
            setPerfil(data)
        } catch (error) {
            console.error("Error creando perfil:", error)
        }
    }

    const signIn = async (email: string, password: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast({
                    title: "Error de autenticación",
                    description: error.message,
                    variant: "destructive",
                })
                return false
            }

            if (data.user) {
                toast({
                    title: "Bienvenido",
                    description: "Has iniciado sesión correctamente",
                })
                return true
            }

            return false
        } catch (error) {
            toast({
                title: "Error",
                description: "Error inesperado al iniciar sesión",
                variant: "destructive",
            })
            return false
        }
    }

    const signUp = async (email: string, password: string, nombre: string): Promise<boolean> => {
        try {

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nombre,
                    },
                },
            })

            if (error) {
                toast({
                    title: "Error de registro",
                    description: error.message,
                    variant: "destructive",
                })
                return false
            }

            if (data.user) {
                toast({
                    title: "Registro exitoso",
                    description: "Revisa tu email para confirmar tu cuenta",
                })
                return true
            }

            return false
        } catch (error) {
            toast({
                title: "Error",
                description: "Error inesperado al registrarse",
                variant: "destructive",
            })
            return false
        }
    }

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error

            toast({
                title: "Sesión cerrada",
                description: "Has cerrado sesión correctamente",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Error al cerrar sesión",
                variant: "destructive",
            })
        }
    }

    const updateProfile = async (data: Partial<Perfil>): Promise<boolean> => {
        if (!user) return false

        try {
            const { error } = await supabase.from("perfiles").update(data).eq("id", user.id)

            if (error) throw error

            // Actualizar estado local
            setPerfil((prev) => (prev ? { ...prev, ...data } : null))

            toast({
                title: "Perfil actualizado",
                description: "Los cambios se guardaron correctamente",
            })

            return true
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar el perfil",
                variant: "destructive",
            })
            return false
        }
    }

    const value = {
        user,
        perfil,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth debe usarse dentro de AuthProvider")
    }
    return context
}
