-- ===================================================================
-- 🔧 SCRIPT PARA ARREGLAR AUTENTICACIÓN MYSQL
-- ===================================================================

-- PASO 1: Cambiar plugin de autenticación para usuario root
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'dante7991.,';

-- PASO 2: Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS estadisticas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- PASO 3: Aplicar cambios
FLUSH PRIVILEGES;

-- PASO 4: Verificar configuración
SELECT user, host, plugin FROM mysql.user WHERE user IN ('root');

-- PASO 5: Mostrar bases de datos
SHOW DATABASES;