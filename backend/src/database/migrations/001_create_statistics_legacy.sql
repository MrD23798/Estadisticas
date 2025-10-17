-- Migración 001: Crear tabla principal de estadísticas (LEGACY)
-- Esta migración se mantiene para compatibilidad con el sistema legacy
-- NOTA: Para el nuevo sistema TypeORM, usar las entidades en /database/entities/

CREATE TABLE IF NOT EXISTS statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dependencia VARCHAR(500) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    cod_objeto VARCHAR(50) NOT NULL,
    naturaleza VARCHAR(10) NOT NULL,
    objeto TEXT NOT NULL,
    periodo INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 0,
    objeto_desc_tipo_expte TEXT,
    
    -- Campos calculados para consultas más rápidas
    year INT GENERATED ALWAYS AS (FLOOR(periodo / 100)) STORED,
    month INT GENERATED ALWAYS AS (periodo % 100) STORED,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para optimizar consultas
    INDEX idx_dependencia (dependencia),
    INDEX idx_codigo (codigo),
    INDEX idx_periodo (periodo),
    INDEX idx_year_month (year, month),
    INDEX idx_dependencia_periodo (dependencia, periodo),
    INDEX idx_codigo_periodo (codigo, periodo),
    INDEX idx_naturaleza (naturaleza),
    
    -- Índice compuesto para consultas complejas
    INDEX idx_dependencia_codigo_periodo (dependencia, codigo, periodo),
    
    -- Índice de texto completo para búsquedas
    FULLTEXT INDEX idx_fulltext_objeto (objeto, objeto_desc_tipo_expte)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;