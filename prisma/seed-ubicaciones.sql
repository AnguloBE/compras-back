-- Insertar ubicaciones iniciales
INSERT INTO ubicaciones (id, nombre, costo, activo, "createdAt", "updatedAt")
VALUES 
  ('clxyz001', 'Angostura', 35.00, true, NOW(), NOW()),
  ('clxyz002', 'Alhuey', 45.00, true, NOW(), NOW())
ON CONFLICT (nombre) DO NOTHING;
