# ══════════════════════════════════════════════════
# seed.ps1 — Insertar datos iniciales en MySQL
# Uso: .\seed.ps1
# ══════════════════════════════════════════════════

Write-Host "🌱 Insertando datos en la base de datos..." -ForegroundColor Cyan

$sql = @"
USE drgueria_productos;
INSERT IGNORE INTO productos (nombre_producto, categoria, precio, stock_actual, stock_minimo) VALUES
('Acetaminofen 500mg x10', 'Analgesico', 2500, 100, 25),
('Ibuprofeno 400mg x10', 'Analgesico', 3200, 100, 25),
('Naproxeno 500mg x10', 'Analgesico', 4800, 100, 25),
('Aspirina 100mg x10', 'Analgesico', 1800, 100, 25),
('Diclofenaco 50mg x10', 'Analgesico', 3600, 100, 25),
('Meloxicam 15mg x10', 'Analgesico', 5200, 100, 25),
('Tramadol 50mg x10', 'Analgesico', 7800, 100, 25),
('Ketorolaco 10mg x10', 'Analgesico', 6500, 100, 25),
('Amoxicilina 500mg x21', 'Antibiotico', 18500, 100, 25),
('Azitromicina 500mg x3', 'Antibiotico', 22000, 100, 25),
('Ciprofloxacino 500mg x10', 'Antibiotico', 15800, 100, 25),
('Metronidazol 500mg x14', 'Antibiotico', 12000, 100, 25),
('Clindamicina 300mg x16', 'Antibiotico', 28000, 100, 25),
('Claritromicina 500mg x14', 'Antibiotico', 35000, 100, 25),
('Cefalexina 500mg x20', 'Antibiotico', 19500, 100, 25),
('Doxiciclina 100mg x10', 'Antibiotico', 14000, 100, 25),
('Vitamina C 1000mg x30', 'Vitaminas y suplementos', 18000, 100, 25),
('Vitamina D3 2000UI x30', 'Vitaminas y suplementos', 22000, 100, 25),
('Complejo B x30', 'Vitaminas y suplementos', 16500, 100, 25),
('Omega 3 1000mg x30', 'Vitaminas y suplementos', 28000, 100, 25),
('Calcio + Vitamina D x60', 'Vitaminas y suplementos', 24000, 100, 25),
('Zinc 50mg x30', 'Vitaminas y suplementos', 15000, 100, 25),
('Hierro + Acido Folico x30', 'Vitaminas y suplementos', 19000, 100, 25),
('Magnesio 400mg x60', 'Vitaminas y suplementos', 32000, 100, 25),
('Protector solar SPF 50 50ml', 'Cuidado personal', 35000, 100, 25),
('Shampoo anticaspa 400ml', 'Cuidado personal', 22000, 100, 25),
('Crema hidratante facial 50ml', 'Cuidado personal', 42000, 100, 25),
('Jabon antibacterial 250ml', 'Cuidado personal', 12000, 100, 25),
('Hilo dental 50m', 'Cuidado personal', 8500, 100, 25),
('Crema dental blanqueadora 75ml', 'Cuidado personal', 14000, 100, 25),
('Desodorante roll-on 50ml', 'Cuidado personal', 18000, 100, 25),
('Gel antibacterial 500ml', 'Cuidado personal', 16000, 100, 25),
('Condon Durex Natural x3', 'Condones', 12000, 100, 25),
('Condon Durex Extra Fino x3', 'Condones', 13500, 100, 25),
('Condon Condomi Ultra x12', 'Condones', 38000, 100, 25),
('Condon Prudence Fresa x3', 'Condones', 11000, 100, 25),
('Condon Control Retard x3', 'Condones', 14500, 100, 25),
('Condon Lifestyles Ultra x12', 'Condones', 35000, 100, 25),
('Condon Vive Placer Real x3', 'Condones', 10500, 100, 25),
('Condon Protex x12', 'Condones', 32000, 100, 25),
('Lubricante Durex Play 50ml', 'Lubricantes', 28000, 100, 25),
('Lubricante Intimo KY 75ml', 'Lubricantes', 32000, 100, 25),
('Lubricante Pjur Original 30ml', 'Lubricantes', 45000, 100, 25),
('Lubricante Nuei Delay 100ml', 'Lubricantes', 38000, 100, 25),
('Lubricante Yes OB Natural 80ml', 'Lubricantes', 52000, 100, 25),
('Lubricante Vive Sensitivo 50ml', 'Lubricantes', 25000, 100, 25),
('Lubricante Prudence Aqua 60ml', 'Lubricantes', 22000, 100, 25),
('Lubricante Control Aqua 75ml', 'Lubricantes', 29000, 100, 25);

USE drgueria_proveedores;
INSERT IGNORE INTO proveedores (nombre, contacto, telefono, categoria) VALUES
('Laboratorios Lafrancol S.A.S', 'Carlos Andres Restrepo', '6024567890', 'Analgesico'),
('Genfar S.A - Grupo Sanofi', 'Maria Claudia Ospina', '6013456789', 'Antibiotico'),
('Tecnoquimicas S.A', 'Juan David Mejia', '6023456789', 'Vitaminas y suplementos'),
('Bayer S.A Colombia', 'Adriana Morales Vargas', '6012345678', 'Cuidado personal'),
('Distribuidora Intima de Colombia S.A.S', 'Jorge Ivan Perez', '3112345678', 'Condones'),
('Laboratorios Siegfried Colombia S.A', 'Sandra Milena Lopez', '6024123456', 'Lubricantes');

SELECT 'productos' as tabla, COUNT(*) as total FROM drgueria_productos.productos
UNION ALL
SELECT 'proveedores', COUNT(*) FROM drgueria_proveedores.proveedores;
"@

# Escribir SQL a archivo temporal
$tmpFile = "$env:TEMP\seed_drgueria.sql"
$sql | Out-File -FilePath $tmpFile -Encoding utf8

# Obtener nombre del pod MySQL
Write-Host "🔍 Buscando pod MySQL..." -ForegroundColor Yellow
$mysqlPod = kubectl get pods -n drgueria -l app=mysql -o jsonpath='{.items[0].metadata.name}' 2>$null

if (-not $mysqlPod) {
    # Intentar con nombre estatefulset
    $mysqlPod = "mysql-0"
}

Write-Host "📦 Pod encontrado: $mysqlPod" -ForegroundColor Yellow

# Copiar archivo SQL al pod
Write-Host "📤 Copiando script al pod..." -ForegroundColor Yellow
kubectl cp $tmpFile "${mysqlPod}:/tmp/seed.sql" -n drgueria

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al copiar el archivo. Verifica que el pod esté corriendo." -ForegroundColor Red
    exit 1
}

# Ejecutar el SQL
Write-Host "⚙️  Ejecutando inserciones..." -ForegroundColor Yellow
kubectl exec -it $mysqlPod -n drgueria -- mysql -u root -pdrgueria2024 -e "source /tmp/seed.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Datos insertados correctamente." -ForegroundColor Green
    Write-Host "   - 48 productos cargados" -ForegroundColor Green
    Write-Host "   -  6 proveedores cargados" -ForegroundColor Green
} else {
    Write-Host "❌ Hubo un error al ejecutar el SQL." -ForegroundColor Red
}

# Limpiar archivo temporal
Remove-Item $tmpFile -Force