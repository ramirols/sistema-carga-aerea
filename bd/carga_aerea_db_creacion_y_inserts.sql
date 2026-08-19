CREATE DATABASE IF NOT EXISTS carga_aerea_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE carga_aerea_db;

SET NAMES utf8mb4;

-- IMPORTANTE:
-- Antes de ejecutar los INSERT, inicia Spring Boot al menos una vez
-- con spring.jpa.hibernate.ddl-auto=update para que Hibernate cree
-- las tablas. El administrador se crea mediante DataInitializer.

START TRANSACTION;

-- ============================================================
-- 1. VUELOS
-- ============================================================

INSERT INTO vuelos (
    codigo,
    origen,
    destino,
    codigo_aeropuerto_origen,
    codigo_aeropuerto_destino,
    terminal_carga_destino,
    fecha_salida,
    hora_salida,
    fecha_llegada,
    hora_llegada,
    capacidad_maxima_kg,
    peso_ocupado_kg,
    estado,
    fecha_creacion,
    fecha_actualizacion,
    version
)
SELECT
    semilla.codigo,
    semilla.origen,
    semilla.destino,
    semilla.codigo_aeropuerto_origen,
    semilla.codigo_aeropuerto_destino,
    semilla.terminal_carga_destino,
    semilla.fecha_salida,
    semilla.hora_salida,
    semilla.fecha_llegada,
    semilla.hora_llegada,
    semilla.capacidad_maxima_kg,
    0.00,
    semilla.estado,
    semilla.fecha_creacion,
    semilla.fecha_actualizacion,
    0
FROM (
    SELECT
        'CA-001' AS codigo,
        'Lima' AS origen,
        'Cusco' AS destino,
        'LIM' AS codigo_aeropuerto_origen,
        'CUZ' AS codigo_aeropuerto_destino,
        'Terminal de carga - Aeropuerto de Cusco' AS terminal_carga_destino,
        DATE_ADD(CURDATE(), INTERVAL 2 DAY) AS fecha_salida,
        CAST('08:30:00' AS TIME) AS hora_salida,
        DATE_ADD(CURDATE(), INTERVAL 2 DAY) AS fecha_llegada,
        CAST('10:00:00' AS TIME) AS hora_llegada,
        1200.00 AS capacidad_maxima_kg,
        'PROGRAMADO' AS estado,
        NOW() AS fecha_creacion,
        NOW() AS fecha_actualizacion

    UNION ALL

    SELECT
        'CA-002', 'Lima', 'Arequipa', 'LIM', 'AQP',
        'Terminal de carga - Aeropuerto de Arequipa',
        DATE_ADD(CURDATE(), INTERVAL 3 DAY), CAST('11:15:00' AS TIME),
        DATE_ADD(CURDATE(), INTERVAL 3 DAY), CAST('12:45:00' AS TIME),
        1500.00, 'PROGRAMADO', NOW(), NOW()

    UNION ALL

    SELECT
        'CA-003', 'Lima', 'Piura', 'LIM', 'PIU',
        'Terminal de carga - Aeropuerto de Piura',
        DATE_ADD(CURDATE(), INTERVAL 4 DAY), CAST('14:20:00' AS TIME),
        DATE_ADD(CURDATE(), INTERVAL 4 DAY), CAST('16:00:00' AS TIME),
        1000.00, 'PROGRAMADO', NOW(), NOW()

    UNION ALL

    SELECT
        'CA-004', 'Lima', 'Trujillo', 'LIM', 'TRU',
        'Terminal de carga - Aeropuerto de Trujillo',
        DATE_ADD(CURDATE(), INTERVAL 1 DAY), CAST('06:45:00' AS TIME),
        DATE_ADD(CURDATE(), INTERVAL 1 DAY), CAST('08:05:00' AS TIME),
        900.00, 'PROGRAMADO', NOW(), NOW()

    UNION ALL

    SELECT
        'CA-005', 'Lima', 'Chiclayo', 'LIM', 'CIX',
        'Terminal de carga - Aeropuerto de Chiclayo',
        DATE_SUB(CURDATE(), INTERVAL 2 DAY), CAST('07:30:00' AS TIME),
        DATE_SUB(CURDATE(), INTERVAL 2 DAY), CAST('08:55:00' AS TIME),
        1100.00, 'DESPACHADO',
        DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)

    UNION ALL

    SELECT
        'CA-006', 'Lima', 'Tarapoto', 'LIM', 'TPP',
        'Terminal de carga - Aeropuerto de Tarapoto',
        DATE_SUB(CURDATE(), INTERVAL 4 DAY), CAST('10:30:00' AS TIME),
        DATE_SUB(CURDATE(), INTERVAL 4 DAY), CAST('12:00:00' AS TIME),
        950.00, 'DESPACHADO',
        DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)

    UNION ALL

    SELECT
        'CA-007', 'Lima', 'Iquitos', 'LIM', 'IQT',
        'Terminal de carga - Aeropuerto de Iquitos',
        DATE_ADD(CURDATE(), INTERVAL 5 DAY), CAST('09:45:00' AS TIME),
        DATE_ADD(CURDATE(), INTERVAL 5 DAY), CAST('11:35:00' AS TIME),
        1300.00, 'CANCELADO', NOW(), NOW()
) AS semilla
LEFT JOIN vuelos existente
    ON existente.codigo = semilla.codigo
WHERE existente.id IS NULL;

-- ============================================================
-- 2. ENCOMIENDAS
-- ============================================================


INSERT INTO encomiendas (
    codigo,
    contenido,
    descripcion,
    remitente,
    destinatario,
    persona_autorizada_nombre,
    persona_autorizada_dni,
    carta_poder_public_id,
    peso_kg,
    largo_cm,
    ancho_cm,
    alto_cm,
    estado,
    vuelo_id,
    fecha_registro,
    fecha_actualizacion
)
SELECT
    semilla.codigo,
    semilla.contenido,
    semilla.descripcion,
    semilla.remitente,
    semilla.destinatario,
    semilla.persona_autorizada_nombre,
    semilla.persona_autorizada_dni,
    semilla.carta_poder_public_id,
    semilla.peso_kg,
    semilla.largo_cm,
    semilla.ancho_cm,
    semilla.alto_cm,
    semilla.estado,
    vuelo.id,
    semilla.fecha_registro,
    semilla.fecha_actualizacion
FROM (
    SELECT
        'EA-00000001' AS codigo,
        'Documentos empresariales' AS contenido,
        'Sobre sellado con contratos y documentacion administrativa.' AS descripcion,
        'Maria Torres Ramirez' AS remitente,
        'Carlos Mendoza Flores' AS destinatario,
        NULL AS persona_autorizada_nombre,
        NULL AS persona_autorizada_dni,
        NULL AS carta_poder_public_id,
        2.50 AS peso_kg,
        35.00 AS largo_cm,
        25.00 AS ancho_cm,
        5.00 AS alto_cm,
        'EN_ALMACEN' AS estado,
        NULL AS vuelo_codigo,
        NOW() AS fecha_registro,
        NOW() AS fecha_actualizacion

    UNION ALL

    SELECT
        'EA-00000002', 'Repuestos electronicos',
        'Componentes protegidos con material antiestatico.',
        'Tecnologia Andina SAC', 'Luis Rodriguez Caceres',
        NULL, NULL, NULL,
        12.00, 60.00, 40.00, 30.00,
        'EN_ALMACEN', NULL, NOW(), NOW()

    UNION ALL

    SELECT
        'EA-00000003', 'Medicamentos',
        'Productos farmaceuticos debidamente sellados.',
        'Distribuidora Medica del Peru', 'Clinica San Gabriel',
        NULL, NULL, NULL,
        8.50, 40.00, 30.00, 20.00,
        'EN_ALMACEN', NULL,
        DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()

    UNION ALL

    SELECT
        'EA-00000004', 'Accesorios personales',
        'Paquete pequeno con accesorios personales.',
        'Rosa Fernandez Rojas', 'Miguel Castillo Pena',
        NULL, NULL, NULL,
        4.25, NULL, NULL, NULL,
        'EN_ALMACEN', NULL,
        DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()

    UNION ALL

    SELECT
        'EA-00000005', 'Productos textiles',
        'Caja con prendas de vestir.',
        'Textiles Lima SAC', 'Comercial Cusco EIRL',
        NULL, NULL, NULL,
        85.00, 80.00, 60.00, 40.00,
        'EN_ALMACEN', 'CA-001',
        DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()

    UNION ALL

    SELECT
        'EA-00000006', 'Equipos informaticos',
        'Computadoras portatiles con embalaje de seguridad.',
        'Soluciones Digitales SAC', 'Empresa Tecnologica Arequipa',
        NULL, NULL, NULL,
        45.00, 60.00, 50.00, 40.00,
        'EMBARCADA', 'CA-002',
        DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()

    UNION ALL

    SELECT
        'EA-00000007', 'Material publicitario',
        'Paneles publicitarios y material promocional.',
        'Agencia Creativa Lima', 'Eventos del Norte SAC',
        NULL, NULL, NULL,
        50.00, 100.00, 60.00, 60.00,
        'EN_ALMACEN', 'CA-003',
        DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()

    UNION ALL

    SELECT
        'EA-00000008', 'Alimentos envasados',
        'Productos no perecibles sellados de fabrica.',
        'Distribuciones Lima Norte', 'Comercial Andina Cusco',
        NULL, NULL, NULL,
        32.00, 50.00, 40.00, 30.00,
        'EMBARCADA', 'CA-001',
        DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()

    UNION ALL

    SELECT
        'EA-00000009', 'Material de oficina',
        'Utiles y materiales administrativos.',
        'Corporacion Lima SAC', 'Oficinas Chiclayo EIRL',
        NULL, NULL, NULL,
        25.00, 50.00, 40.00, 25.00,
        'ENTREGADA', 'CA-005',
        DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)

    UNION ALL

    SELECT
        'EA-00000010', 'Productos artesanales',
        'Artesanias debidamente protegidas.',
        'Artesanos Unidos de Lima', 'Tienda Regional Tarapoto',
        NULL, NULL, NULL,
        18.00, 45.00, 35.00, 25.00,
        'ENTREGADA', 'CA-006',
        DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)

    UNION ALL

    SELECT
        'EA-00000011', 'Articulos personales',
        'Caja con articulos personales y documentos.',
        'Jorge Salazar Nunez', 'Ana Lucia Chavez',
        'Pedro Chavez Lopez', '74859632', NULL,
        10.00, 40.00, 30.00, 20.00,
        'EN_ALMACEN', NULL,
        DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()

    UNION ALL

    SELECT
        'EA-00000012', 'Repuestos para maquinaria',
        'Repuestos industriales embalados en caja de madera.',
        'Industrias del Peru SAC', 'Mantenimiento Piura EIRL',
        'Roberto Vasquez Diaz', '70214589', NULL,
        65.00, 70.00, 50.00, 40.00,
        'EN_ALMACEN', 'CA-003',
        DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()

    UNION ALL

    SELECT
        'EA-00000013', 'Muestras comerciales',
        'Envio cancelado por solicitud del remitente.',
        'Importaciones Lima SAC', 'Distribuciones Loreto',
        NULL, NULL, NULL,
        18.00, 45.00, 35.00, 25.00,
        'CANCELADA', NULL,
        DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()

    UNION ALL

    SELECT
        'EA-00000014', 'Equipos de fotografia',
        'Envio cancelado antes de asignarse a un vuelo.',
        'Producciones Lima', 'Fotografia Amazonica',
        NULL, NULL, NULL,
        22.00, 50.00, 40.00, 30.00,
        'CANCELADA', NULL,
        DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()
) AS semilla
LEFT JOIN vuelos vuelo
    ON vuelo.codigo = semilla.vuelo_codigo
LEFT JOIN encomiendas existente
    ON existente.codigo = semilla.codigo
WHERE existente.id IS NULL
  AND (
      semilla.vuelo_codigo IS NULL
      OR vuelo.id IS NOT NULL
  );

-- ============================================================
-- 3. RECALCULAR PESO OCUPADO DE CADA VUELO
-- ============================================================

UPDATE vuelos v
SET
    v.peso_ocupado_kg = COALESCE(
        (
            SELECT SUM(
                GREATEST(
                    e.peso_kg,
                    CASE
                        WHEN e.largo_cm IS NOT NULL
                         AND e.ancho_cm IS NOT NULL
                         AND e.alto_cm IS NOT NULL
                        THEN ROUND(
                            (e.largo_cm * e.ancho_cm * e.alto_cm) / 5000,
                            2
                        )
                        ELSE 0
                    END
                )
            )
            FROM encomiendas e
            WHERE e.vuelo_id = v.id
              AND e.estado <> 'CANCELADA'
        ),
        0.00
    ),
    v.fecha_actualizacion = NOW(),
    v.version = COALESCE(v.version, 0)
WHERE v.id > 0;

COMMIT;

-- ============================================================
-- 4. COMPROBACIONES
-- ============================================================

SELECT
    id,
    codigo,
    origen,
    destino,
    estado,
    capacidad_maxima_kg,
    peso_ocupado_kg,
    version
FROM vuelos
ORDER BY id;

SELECT
    e.id,
    e.codigo,
    e.contenido,
    e.estado,
    e.peso_kg,
    ROUND(
        CASE
            WHEN e.largo_cm IS NOT NULL
             AND e.ancho_cm IS NOT NULL
             AND e.alto_cm IS NOT NULL
            THEN (e.largo_cm * e.ancho_cm * e.alto_cm) / 5000
            ELSE 0
        END,
        2
    ) AS peso_volumetrico_kg,
    GREATEST(
        e.peso_kg,
        CASE
            WHEN e.largo_cm IS NOT NULL
             AND e.ancho_cm IS NOT NULL
             AND e.alto_cm IS NOT NULL
            THEN ROUND(
                (e.largo_cm * e.ancho_cm * e.alto_cm) / 5000,
                2
            )
            ELSE 0
        END
    ) AS peso_cobrable_kg,
    v.codigo AS vuelo
FROM encomiendas e
LEFT JOIN vuelos v
    ON v.id = e.vuelo_id
ORDER BY e.id;

SELECT
    codigo,
    contenido,
    remitente,
    destinatario,
    persona_autorizada_nombre,
    persona_autorizada_dni,
    carta_poder_public_id,
    estado
FROM encomiendas
WHERE persona_autorizada_nombre IS NOT NULL
ORDER BY fecha_registro DESC;

SELECT estado, COUNT(*) AS cantidad
FROM encomiendas
GROUP BY estado
ORDER BY estado;

SELECT estado, COUNT(*) AS cantidad
FROM vuelos
GROUP BY estado
ORDER BY estado;
