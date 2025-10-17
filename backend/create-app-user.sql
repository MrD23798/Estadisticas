-- ===================================================================
-- 🔧 SCRIPT PARA CREAR USUARIO ESPECÍFICO PARA LA APLICACIÓN
-- ===================================================================

-- PASO 1: Crear usuario específico para la aplicación
CREATE USER IF NOT EXISTS 'estadisticas_app'@'localhost' IDENTIFIED WITH mysql_native_password BY 'EstadisticasApp2024!';
CREATE USER IF NOT EXISTS 'estadisticas_app'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'EstadisticasApp2024!';

-- PASO 2: Dar permisos completos sobre la base de datos estadisticas
GRANT ALL PRIVILEGES ON estadisticas.* TO 'estadisticas_app'@'localhost';
GRANT ALL PRIVILEGES ON estadisticas.* TO 'estadisticas_app'@'127.0.0.1';

-- PASO 3: Aplicar cambios
FLUSH PRIVILEGES;

-- PASO 4: Verificar que el usuario se creó correctamente
SELECT user, host, plugin FROM mysql.user WHERE user = 'estadisticas_app';

-- PASO 5: Probar conexión (opcional)
-- mysql -u estadisticas_app -p -h localhost estadisticas