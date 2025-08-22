-- Configurar autenticación en Supabase
-- Este script debe ejecutarse en el SQL Editor de Supabase
-- Crear tabla de perfiles de usuario (opcional, para información adicional)
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nombre VARCHAR(255),
    email VARCHAR(255),
    rol VARCHAR(50) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- Crear función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION crear_perfil_usuario() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO perfiles (id, email, nombre)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'nombre',
            split_part(NEW.email, '@', 1)
        )
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Crear trigger para ejecutar la función cuando se crea un usuario
DROP TRIGGER IF EXISTS crear_perfil_trigger ON auth.users;
CREATE TRIGGER crear_perfil_trigger
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION crear_perfil_usuario();
-- Habilitar RLS (Row Level Security) en todas las tablas principales
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
-- Políticas de seguridad - Solo usuarios autenticados pueden acceder
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver productos" ON productos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver pedidos" ON pedidos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver pedidos_item" ON pedidos_item FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver ventas" ON ventas FOR ALL USING (auth.role() = 'authenticated');
-- Política para perfiles - usuarios pueden ver y editar su propio perfil
CREATE POLICY "Usuarios pueden ver su perfil" ON perfiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su perfil" ON perfiles FOR
UPDATE USING (auth.uid() = id);
-- Política para admins - pueden ver todos los perfiles
CREATE POLICY "Admins pueden ver todos los perfiles" ON perfiles FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM perfiles
        WHERE id = auth.uid()
            AND rol = 'admin'
    )
);
-- Insertar usuario admin inicial (opcional)
-- Nota: Este usuario debe registrarse primero a través de la interfaz
-- Luego puedes actualizar su rol a 'admin' manualmente