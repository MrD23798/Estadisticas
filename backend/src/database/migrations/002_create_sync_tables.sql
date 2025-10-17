-- Migración para crear las tablas del sistema de sincronización avanzado
-- Archivo: 002_create_sync_tables.sql

-- Tabla de tipos de caso
CREATE TABLE IF NOT EXISTS tipos_caso (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Nombre del tipo de caso',
    codigo VARCHAR(50) NULL COMMENT 'Código o abreviatura del tipo de caso',
    descripcion TEXT NULL COMMENT 'Descripción detallada del tipo de caso',
    categoria VARCHAR(100) NULL COMMENT 'Categoría general del tipo de caso',
    activo BOOLEAN DEFAULT TRUE COMMENT 'Si el tipo de caso está activo',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    metadatos JSON NULL COMMENT 'Metadatos adicionales en formato JSON',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
    
    INDEX idx_tipos_caso_name (name),
    INDEX idx_tipos_caso_activo (activo),
    INDEX idx_tipos_caso_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de estadísticas por tipo de caso
CREATE TABLE IF NOT EXISTS estadisticas_tipo_caso (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estadisticaId INT NOT NULL COMMENT 'ID de la estadística principal',
    tipoCasoId INT NOT NULL COMMENT 'ID del tipo de caso',
    recibidosAsignados INT DEFAULT 0 COMMENT 'Cantidad de casos recibidos asignados',
    reingresados INT DEFAULT 0 COMMENT 'Cantidad de casos reingresados',
    existentes INT DEFAULT 0 COMMENT 'Cantidad de casos existentes al inicio del período',
    total INT DEFAULT 0 COMMENT 'Cantidad total de casos',
    resueltos INT DEFAULT 0 COMMENT 'Cantidad de casos resueltos',
    pendientes INT DEFAULT 0 COMMENT 'Cantidad de casos pendientes',
    porcentajeResolucion DECIMAL(5,2) DEFAULT 0 COMMENT 'Porcentaje de resolución',
    datosAdicionales JSON NULL COMMENT 'Datos adicionales específicos del tipo de caso',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
    
    UNIQUE INDEX idx_estadisticas_tipo_caso_unique (estadisticaId, tipoCasoId),
    INDEX idx_estadisticas_tipo_caso_estadistica (estadisticaId),
    INDEX idx_estadisticas_tipo_caso_tipo (tipoCasoId),
    INDEX idx_estadisticas_tipo_caso_resolucion (porcentajeResolucion),
    
    FOREIGN KEY (estadisticaId) REFERENCES estadisticas(id) ON DELETE CASCADE,
    FOREIGN KEY (tipoCasoId) REFERENCES tipos_caso(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunos tipos de caso comunes como datos iniciales
INSERT IGNORE INTO tipos_caso (name, codigo, descripcion, categoria, orden) VALUES
('CIVIL', 'CIV', 'Casos civiles generales', 'Civil', 1),
('COMERCIAL', 'COM', 'Casos comerciales', 'Civil', 2),
('PENAL', 'PEN', 'Casos penales', 'Penal', 3),
('LABORAL', 'LAB', 'Casos laborales', 'Laboral', 4),
('CONTENCIOSO ADMINISTRATIVO', 'CA', 'Casos contencioso administrativos', 'Administrativo', 5),
('FAMILIA', 'FAM', 'Casos de familia', 'Civil', 6),
('SUCESIONES', 'SUC', 'Casos de sucesiones', 'Civil', 7),
('CONCURSOS Y QUIEBRAS', 'CQ', 'Casos de concursos y quiebras', 'Comercial', 8),
('AMPARO', 'AMP', 'Recursos de amparo', 'Constitutional', 9),
('HABEAS CORPUS', 'HC', 'Recursos de habeas corpus', 'Constitutional', 10);

-- Crear vista para estadísticas consolidadas por tipo de caso
CREATE OR REPLACE VIEW vw_estadisticas_tipo_caso_consolidadas AS
SELECT 
    tc.id as tipo_caso_id,
    tc.name as tipo_caso_nombre,
    tc.categoria as tipo_caso_categoria,
    COUNT(etc.id) as total_registros,
    SUM(etc.recibidosAsignados) as total_recibidos_asignados,
    SUM(etc.reingresados) as total_reingresados,
    SUM(etc.existentes) as total_existentes,
    SUM(etc.total) as total_casos,
    SUM(etc.resueltos) as total_resueltos,
    SUM(etc.pendientes) as total_pendientes,
    CASE 
        WHEN SUM(etc.total) > 0 THEN ROUND((SUM(etc.resueltos) / SUM(etc.total)) * 100, 2)
        ELSE 0 
    END as porcentaje_resolucion_global,
    MIN(e.periodo) as periodo_desde,
    MAX(e.periodo) as periodo_hasta,
    MAX(etc.updatedAt) as ultima_actualizacion
FROM tipos_caso tc
LEFT JOIN estadisticas_tipo_caso etc ON tc.id = etc.tipoCasoId
LEFT JOIN estadisticas e ON etc.estadisticaId = e.id
WHERE tc.activo = TRUE
GROUP BY tc.id, tc.name, tc.categoria
ORDER BY tc.orden, tc.name;

-- Crear vista para ranking de dependencias por resolución
CREATE OR REPLACE VIEW vw_ranking_dependencias_resolucion AS
SELECT 
    d.id as dependencia_id,
    d.nombre as dependencia_nombre,
    d.tipo as dependencia_tipo,
    COUNT(DISTINCT e.id) as total_periodos,
    COUNT(DISTINCT etc.tipoCasoId) as tipos_caso_atendidos,
    SUM(etc.total) as total_casos_periodo,
    SUM(etc.resueltos) as total_resueltos_periodo,
    SUM(etc.pendientes) as total_pendientes_periodo,
    CASE 
        WHEN SUM(etc.total) > 0 THEN ROUND((SUM(etc.resueltos) / SUM(etc.total)) * 100, 2)
        ELSE 0 
    END as porcentaje_resolucion_global,
    MAX(e.periodo) as ultimo_periodo_reportado,
    MAX(e.updatedAt) as ultima_actualizacion
FROM dependencias d
INNER JOIN estadisticas e ON d.id = e.dependenciaId
INNER JOIN estadisticas_tipo_caso etc ON e.id = etc.estadisticaId
WHERE d.activa = TRUE
GROUP BY d.id, d.nombre, d.tipo
HAVING total_casos_periodo > 0
ORDER BY porcentaje_resolucion_global DESC, total_casos_periodo DESC;

-- Comentarios descriptivos
ALTER TABLE tipos_caso COMMENT = 'Catálogo de tipos de casos judiciales';
ALTER TABLE estadisticas_tipo_caso COMMENT = 'Estadísticas detalladas por tipo de caso y período';

-- Verificar que las tablas se crearon correctamente
SELECT 
    TABLE_NAME as 'Tabla Creada',
    TABLE_COMMENT as 'Descripción',
    TABLE_ROWS as 'Filas'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('tipos_caso', 'estadisticas_tipo_caso')
ORDER BY TABLE_NAME;