# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
# seed-completo.ps1 ??? Dataset completo para DRGUERIA
# Inserta: usuarios, pedidos, compras, pagos, notificaciones, auditoria
# Uso: .\seed-completo.ps1
# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

Write-Host ""
Write-Host "????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host "???   DRGUERIA ??? Seed de datos completo      ???" -ForegroundColor Cyan
Write-Host "????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host ""

$mysqlPod = "mysql-0"
Write-Host "???? Pod MySQL: $mysqlPod" -ForegroundColor Yellow

# ?????? Funci??n para ejecutar bloque SQL ??????????????????????????????????????????????????????????????????????????????
function Ejecutar-SQL {
    param($sql, $nombre)
    $tmp = "$env:TEMP\drg_$nombre.sql"
    $sql | Out-File -FilePath $tmp -Encoding UTF8
    kubectl cp $tmp "$mysqlPod:/tmp/$nombre.sql" -n drgueria | Out-Null
    kubectl exec -i $mysqlPod -n drgueria -- mysql -u root -pdrgueria2024 -e "source /tmp/$nombre.sql" 2>&1 | Where-Object { $_ -notmatch "Warning" }
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}

# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
# 1. PRODUCTOS Y PROVEEDORES
# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
Write-Host ""
Write-Host "1/6  Productos y proveedores..." -ForegroundColor Yellow
Ejecutar-SQL @"
USE drgueria_productos;
INSERT IGNORE INTO productos (nombre_producto, categoria, precio, stock_actual, stock_minimo) VALUES
('Acetaminofen 500mg x10','Analgesico',2500,100,25),
('Ibuprofeno 400mg x10','Analgesico',3200,100,25),
('Naproxeno 500mg x10','Analgesico',4800,100,25),
('Aspirina 100mg x10','Analgesico',1800,100,25),
('Diclofenaco 50mg x10','Analgesico',3600,100,25),
('Meloxicam 15mg x10','Analgesico',5200,100,25),
('Tramadol 50mg x10','Analgesico',7800,100,25),
('Ketorolaco 10mg x10','Analgesico',6500,100,25),
('Amoxicilina 500mg x21','Antibiotico',18500,100,25),
('Azitromicina 500mg x3','Antibiotico',22000,100,25),
('Ciprofloxacino 500mg x10','Antibiotico',15800,100,25),
('Metronidazol 500mg x14','Antibiotico',12000,100,25),
('Clindamicina 300mg x16','Antibiotico',28000,100,25),
('Claritromicina 500mg x14','Antibiotico',35000,100,25),
('Cefalexina 500mg x20','Antibiotico',19500,100,25),
('Doxiciclina 100mg x10','Antibiotico',14000,100,25),
('Vitamina C 1000mg x30','Vitaminas y suplementos',18000,100,25),
('Vitamina D3 2000UI x30','Vitaminas y suplementos',22000,100,25),
('Complejo B x30','Vitaminas y suplementos',16500,100,25),
('Omega 3 1000mg x30','Vitaminas y suplementos',28000,100,25),
('Calcio + Vitamina D x60','Vitaminas y suplementos',24000,100,25),
('Zinc 50mg x30','Vitaminas y suplementos',15000,100,25),
('Hierro + Acido Folico x30','Vitaminas y suplementos',19000,100,25),
('Magnesio 400mg x60','Vitaminas y suplementos',32000,100,25),
('Protector solar SPF 50 50ml','Cuidado personal',35000,100,25),
('Shampoo anticaspa 400ml','Cuidado personal',22000,100,25),
('Crema hidratante facial 50ml','Cuidado personal',42000,100,25),
('Jabon antibacterial 250ml','Cuidado personal',12000,100,25),
('Hilo dental 50m','Cuidado personal',8500,100,25),
('Crema dental blanqueadora 75ml','Cuidado personal',14000,100,25),
('Desodorante roll-on 50ml','Cuidado personal',18000,100,25),
('Gel antibacterial 500ml','Cuidado personal',16000,100,25),
('Condon Durex Natural x3','Condones',12000,100,25),
('Condon Durex Extra Fino x3','Condones',13500,100,25),
('Condon Condomi Ultra x12','Condones',38000,100,25),
('Condon Prudence Fresa x3','Condones',11000,100,25),
('Condon Control Retard x3','Condones',14500,100,25),
('Condon Lifestyles Ultra x12','Condones',35000,100,25),
('Condon Vive Placer Real x3','Condones',10500,100,25),
('Condon Protex x12','Condones',32000,100,25),
('Lubricante Durex Play 50ml','Lubricantes',28000,100,25),
('Lubricante Intimo KY 75ml','Lubricantes',32000,100,25),
('Lubricante Pjur Original 30ml','Lubricantes',45000,100,25),
('Lubricante Nuei Delay 100ml','Lubricantes',38000,100,25),
('Lubricante Yes OB Natural 80ml','Lubricantes',52000,100,25),
('Lubricante Vive Sensitivo 50ml','Lubricantes',25000,100,25),
('Lubricante Prudence Aqua 60ml','Lubricantes',22000,100,25),
('Lubricante Control Aqua 75ml','Lubricantes',29000,100,25);

USE drgueria_proveedores;
INSERT IGNORE INTO proveedores (nombre,contacto,telefono,categoria) VALUES
('Laboratorios Lafrancol S.A.S','Carlos Andres Restrepo','6024567890','Analgesico'),
('Genfar S.A - Grupo Sanofi','Maria Claudia Ospina','6013456789','Antibiotico'),
('Tecnoquimicas S.A','Juan David Mejia','6023456789','Vitaminas y suplementos'),
('Bayer S.A Colombia','Adriana Morales Vargas','6012345678','Cuidado personal'),
('Distribuidora Intima de Colombia S.A.S','Jorge Ivan Perez','3112345678','Condones'),
('Laboratorios Siegfried Colombia S.A','Sandra Milena Lopez','6024123456','Lubricantes');
"@ "bloque1"
Write-Host "   ??? OK" -ForegroundColor Green

# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
# 2. USUARIOS (41 total: 1 admin + 40 clientes)
# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
Write-Host "2/6  Usuarios..." -ForegroundColor Yellow
$hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
Ejecutar-SQL @"
USE drgueria_usuarios;
INSERT IGNORE INTO usuarios (nombre,correo,contrasena,rol) VALUES
('Admin','admin@gmail.com','$hash','administrador'),
('Cliente 1','cliente@gmail.com','$hash','cliente'),
('Cliente 2','cliente2@gmail.com','$hash','cliente'),
('Maria Fernanda Lopez','mfernanda@gmail.com','$hash','cliente'),
('Juan Camilo Restrepo','jcrestrepo@gmail.com','$hash','cliente'),
('Valentina Torres','vtorres@gmail.com','$hash','cliente'),
('Andres Felipe Gomez','afgomez@gmail.com','$hash','cliente'),
('Catalina Mendez','cmendez@gmail.com','$hash','cliente'),
('Santiago Herrera','sherrera@gmail.com','$hash','cliente'),
('Laura Milena Castro','lmcastro@gmail.com','$hash','cliente'),
('Daniel Ospina','dospina@gmail.com','$hash','cliente'),
('Natalia Vargas','nvargas@gmail.com','$hash','cliente'),
('Miguel Angel Rios','marios@gmail.com','$hash','cliente'),
('Isabella Moreno','imoreno@gmail.com','$hash','cliente'),
('Sebastian Cardona','scardona@gmail.com','$hash','cliente'),
('Camila Jimenez','cjimenez@gmail.com','$hash','cliente'),
('Felipe Salazar','fsalazar@gmail.com','$hash','cliente'),
('Daniela Ramirez','dramirez@gmail.com','$hash','cliente'),
('Alejandro Pena','apena@gmail.com','$hash','cliente'),
('Monica Gutierrez','mgutierrez@gmail.com','$hash','cliente'),
('Carlos Eduardo Mejia','cemejia@gmail.com','$hash','cliente'),
('Luisa Fernanda Diaz','lfdiaz@gmail.com','$hash','cliente'),
('Jorge Andres Ruiz','jaruiz@gmail.com','$hash','cliente'),
('Paola Andrea Silva','pasilva@gmail.com','$hash','cliente'),
('Ricardo Leon','rleon@gmail.com','$hash','cliente'),
('Andrea Castellanos','acastellanos@gmail.com','$hash','cliente'),
('Mauricio Londono','mlondono@gmail.com','$hash','cliente'),
('Tatiana Correa','tcorrea@gmail.com','$hash','cliente'),
('Nicolas Perez','nperez@gmail.com','$hash','cliente'),
('Diana Marcela Florez','dmflorez@gmail.com','$hash','cliente'),
('Ivan Dario Munoz','idmunoz@gmail.com','$hash','cliente'),
('Gloria Amparo Velez','gavelez@gmail.com','$hash','cliente'),
('Esteban Montoya','emontoya@gmail.com','$hash','cliente'),
('Adriana Posada','aposada@gmail.com','$hash','cliente'),
('Hector Fabio Arango','hfarango@gmail.com','$hash','cliente'),
('Melissa Aguirre','maguirre@gmail.com','$hash','cliente'),
('Cristian Bedoya','cbedoya@gmail.com','$hash','cliente'),
('Yesenia Castano','ycastano@gmail.com','$hash','cliente'),
('Pablo Escobar Velez','pevelez@gmail.com','$hash','cliente'),
('Sandra Milena Cano','smcano@gmail.com','$hash','cliente'),
('Rodrigo Alvarez','ralvarez@gmail.com','$hash','cliente');
"@ "bloque2"
Write-Host "   ??? OK" -ForegroundColor Green

# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
# 3. PEDIDOS A PROVEEDORES (55)
# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
Write-Host "3/6  Pedidos a proveedores..." -ForegroundColor Yellow
Ejecutar-SQL @"
USE drgueria_proveedores;
INSERT IGNORE INTO pedidos (id_producto,id_proveedor,cantidad_solicitada,estado_pedido,fecha_pedido,fecha_entrega,numero_factura) VALUES
(1,1,50,'entregado','2025-01-05 09:00:00','2025-01-10 14:00:00','FAC-PED-0001'),
(2,1,30,'entregado','2025-01-08 10:00:00','2025-01-13 11:00:00','FAC-PED-0002'),
(3,1,40,'entregado','2025-01-12 08:30:00','2025-01-17 09:00:00','FAC-PED-0003'),
(9,2,25,'entregado','2025-01-15 11:00:00','2025-01-20 15:00:00','FAC-PED-0004'),
(10,2,20,'entregado','2025-01-18 09:30:00','2025-01-23 10:00:00','FAC-PED-0005'),
(11,2,35,'entregado','2025-01-22 10:00:00','2025-01-27 14:00:00','FAC-PED-0006'),
(17,3,45,'entregado','2025-02-01 08:00:00','2025-02-06 09:00:00','FAC-PED-0007'),
(18,3,30,'entregado','2025-02-05 09:00:00','2025-02-10 11:00:00','FAC-PED-0008'),
(19,3,25,'entregado','2025-02-08 10:30:00','2025-02-13 14:00:00','FAC-PED-0009'),
(25,4,20,'entregado','2025-02-12 11:00:00','2025-02-17 15:00:00','FAC-PED-0010'),
(26,4,15,'entregado','2025-02-15 09:00:00','2025-02-20 10:00:00','FAC-PED-0011'),
(27,4,30,'entregado','2025-02-18 08:30:00','2025-02-23 09:30:00','FAC-PED-0012'),
(33,5,40,'entregado','2025-03-01 09:00:00','2025-03-06 11:00:00','FAC-PED-0013'),
(34,5,35,'entregado','2025-03-05 10:00:00','2025-03-10 14:00:00','FAC-PED-0014'),
(35,5,25,'entregado','2025-03-08 11:30:00','2025-03-13 15:00:00','FAC-PED-0015'),
(41,6,20,'entregado','2025-03-12 08:00:00','2025-03-17 09:00:00','FAC-PED-0016'),
(42,6,30,'entregado','2025-03-15 09:30:00','2025-03-20 11:00:00','FAC-PED-0017'),
(43,6,15,'entregado','2025-03-18 10:00:00','2025-03-23 14:00:00','FAC-PED-0018'),
(4,1,50,'entregado','2025-03-22 11:00:00','2025-03-27 15:00:00','FAC-PED-0019'),
(5,1,40,'entregado','2025-04-01 09:00:00','2025-04-06 10:00:00','FAC-PED-0020'),
(12,2,30,'entregado','2025-04-05 08:30:00','2025-04-10 09:30:00','FAC-PED-0021'),
(13,2,25,'entregado','2025-04-08 10:00:00','2025-04-13 14:00:00','FAC-PED-0022'),
(20,3,35,'entregado','2025-04-12 11:00:00','2025-04-17 15:00:00','FAC-PED-0023'),
(21,3,20,'entregado','2025-04-15 09:00:00','2025-04-20 10:00:00','FAC-PED-0024'),
(28,4,25,'entregado','2025-04-18 08:00:00','2025-04-23 09:00:00','FAC-PED-0025'),
(36,5,30,'entregado','2025-04-22 10:30:00','2025-04-27 14:00:00','FAC-PED-0026'),
(44,6,20,'entregado','2025-05-01 09:00:00','2025-05-06 11:00:00','FAC-PED-0027'),
(6,1,45,'entregado','2025-05-05 08:30:00','2025-05-10 09:30:00','FAC-PED-0028'),
(7,1,35,'entregado','2025-05-08 10:00:00','2025-05-13 14:00:00','FAC-PED-0029'),
(14,2,40,'entregado','2025-05-12 11:00:00','2025-05-17 15:00:00','FAC-PED-0030'),
(15,2,30,'en proceso','2025-05-15 09:00:00','2025-05-25 10:00:00','FAC-PED-0031'),
(22,3,25,'en proceso','2025-05-18 08:00:00','2025-05-28 09:00:00','FAC-PED-0032'),
(23,3,20,'en proceso','2025-05-20 10:30:00','2025-05-30 14:00:00','FAC-PED-0033'),
(29,4,35,'en proceso','2025-05-22 09:00:00','2025-06-01 11:00:00','FAC-PED-0034'),
(37,5,40,'aceptado','2025-05-25 08:30:00',NULL,'FAC-PED-0035'),
(45,6,25,'aceptado','2025-05-26 10:00:00',NULL,'FAC-PED-0036'),
(8,1,30,'aceptado','2025-05-27 11:00:00',NULL,'FAC-PED-0037'),
(16,2,20,'aceptado','2025-05-27 09:00:00',NULL,'FAC-PED-0038'),
(24,3,35,'aceptado','2025-05-28 08:00:00',NULL,'FAC-PED-0039'),
(30,4,25,'aceptado','2025-05-28 10:30:00',NULL,'FAC-PED-0040'),
(38,5,30,'aceptado','2025-05-29 09:00:00',NULL,'FAC-PED-0041'),
(46,6,20,'aceptado','2025-05-29 11:00:00',NULL,'FAC-PED-0042'),
(1,1,50,'entregado','2025-04-25 09:00:00','2025-04-30 14:00:00','FAC-PED-0043'),
(9,2,40,'entregado','2025-04-28 10:00:00','2025-05-03 11:00:00','FAC-PED-0044'),
(17,3,30,'entregado','2025-05-02 08:30:00','2025-05-07 09:30:00','FAC-PED-0045'),
(25,4,25,'entregado','2025-05-05 09:00:00','2025-05-10 14:00:00','FAC-PED-0046'),
(33,5,35,'entregado','2025-05-08 10:30:00','2025-05-13 15:00:00','FAC-PED-0047'),
(41,6,20,'entregado','2025-05-10 08:00:00','2025-05-15 09:00:00','FAC-PED-0048'),
(2,1,45,'entregado','2025-05-12 11:00:00','2025-05-17 14:00:00','FAC-PED-0049'),
(10,2,30,'entregado','2025-05-14 09:30:00','2025-05-19 10:30:00','FAC-PED-0050'),
(18,3,25,'en proceso','2025-05-23 08:00:00','2025-06-02 09:00:00','FAC-PED-0051'),
(26,4,20,'en proceso','2025-05-24 10:00:00','2025-06-03 14:00:00','FAC-PED-0052'),
(34,5,30,'aceptado','2025-05-28 09:00:00',NULL,'FAC-PED-0053'),
(42,6,35,'aceptado','2025-05-29 11:30:00',NULL,'FAC-PED-0054'),
(3,1,40,'aceptado','2025-05-30 08:30:00',NULL,'FAC-PED-0055');
"@ "bloque3"
Write-Host "   ??? OK" -ForegroundColor Green

# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
# 4. COMPRAS (55)
# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
Write-Host "4/6  Compras..." -ForegroundColor Yellow
Ejecutar-SQL @"
USE drgueria_compras;
INSERT IGNORE INTO compras (id_compra,usuario_id,items,total,metodo_pago,estado,numero_factura,createdAt) VALUES
(1,2,'[{"producto_id":1,"nombre":"Acetaminofen 500mg x10","cantidad":2,"precio":2500}]',5000,'efectivo','pagado','FAC-COMP-0001','2025-01-10 10:30:00'),
(2,3,'[{"producto_id":9,"nombre":"Amoxicilina 500mg x21","cantidad":1,"precio":18500}]',18500,'tarjeta','pagado','FAC-COMP-0002','2025-01-12 11:00:00'),
(3,4,'[{"producto_id":17,"nombre":"Vitamina C 1000mg x30","cantidad":2,"precio":18000},{"producto_id":18,"nombre":"Vitamina D3 2000UI x30","cantidad":1,"precio":22000}]',58000,'efectivo','pagado','FAC-COMP-0003','2025-01-15 14:00:00'),
(4,5,'[{"producto_id":25,"nombre":"Protector solar SPF 50 50ml","cantidad":1,"precio":35000}]',35000,'tarjeta','pagado','FAC-COMP-0004','2025-01-18 09:30:00'),
(5,6,'[{"producto_id":33,"nombre":"Condon Durex Natural x3","cantidad":3,"precio":12000}]',36000,'efectivo','pagado','FAC-COMP-0005','2025-01-20 16:00:00'),
(6,7,'[{"producto_id":41,"nombre":"Lubricante Durex Play 50ml","cantidad":1,"precio":28000}]',28000,'nequi','pagado','FAC-COMP-0006','2025-01-22 12:00:00'),
(7,8,'[{"producto_id":2,"nombre":"Ibuprofeno 400mg x10","cantidad":2,"precio":3200},{"producto_id":3,"nombre":"Naproxeno 500mg x10","cantidad":1,"precio":4800}]',11200,'efectivo','pagado','FAC-COMP-0007','2025-01-25 10:00:00'),
(8,9,'[{"producto_id":10,"nombre":"Azitromicina 500mg x3","cantidad":1,"precio":22000}]',22000,'tarjeta','pagado','FAC-COMP-0008','2025-01-28 11:30:00'),
(9,10,'[{"producto_id":20,"nombre":"Omega 3 1000mg x30","cantidad":2,"precio":28000}]',56000,'daviplata','pagado','FAC-COMP-0009','2025-02-01 09:00:00'),
(10,11,'[{"producto_id":26,"nombre":"Shampoo anticaspa 400ml","cantidad":1,"precio":22000}]',22000,'efectivo','pagado','FAC-COMP-0010','2025-02-03 14:30:00'),
(11,12,'[{"producto_id":34,"nombre":"Condon Durex Extra Fino x3","cantidad":2,"precio":13500}]',27000,'tarjeta','pagado','FAC-COMP-0011','2025-02-05 10:00:00'),
(12,13,'[{"producto_id":42,"nombre":"Lubricante Intimo KY 75ml","cantidad":1,"precio":32000}]',32000,'nequi','pagado','FAC-COMP-0012','2025-02-08 11:00:00'),
(13,14,'[{"producto_id":4,"nombre":"Aspirina 100mg x10","cantidad":3,"precio":1800}]',5400,'efectivo','pagado','FAC-COMP-0013','2025-02-10 09:30:00'),
(14,15,'[{"producto_id":11,"nombre":"Ciprofloxacino 500mg x10","cantidad":1,"precio":15800}]',15800,'tarjeta','pagado','FAC-COMP-0014','2025-02-12 12:00:00'),
(15,16,'[{"producto_id":19,"nombre":"Complejo B x30","cantidad":2,"precio":16500},{"producto_id":22,"nombre":"Zinc 50mg x30","cantidad":1,"precio":15000}]',48000,'daviplata','pagado','FAC-COMP-0015','2025-02-15 10:00:00'),
(16,17,'[{"producto_id":27,"nombre":"Crema hidratante facial 50ml","cantidad":1,"precio":42000}]',42000,'efectivo','pagado','FAC-COMP-0016','2025-02-18 11:30:00'),
(17,18,'[{"producto_id":35,"nombre":"Condon Condomi Ultra x12","cantidad":1,"precio":38000}]',38000,'tarjeta','pagado','FAC-COMP-0017','2025-02-20 09:00:00'),
(18,19,'[{"producto_id":43,"nombre":"Lubricante Pjur Original 30ml","cantidad":1,"precio":45000}]',45000,'nequi','pagado','FAC-COMP-0018','2025-02-22 14:00:00'),
(19,20,'[{"producto_id":5,"nombre":"Diclofenaco 50mg x10","cantidad":2,"precio":3600}]',7200,'efectivo','pagado','FAC-COMP-0019','2025-02-25 10:30:00'),
(20,21,'[{"producto_id":12,"nombre":"Metronidazol 500mg x14","cantidad":1,"precio":12000}]',12000,'tarjeta','pagado','FAC-COMP-0020','2025-03-01 09:00:00'),
(21,22,'[{"producto_id":21,"nombre":"Calcio + Vitamina D x60","cantidad":1,"precio":24000},{"producto_id":23,"nombre":"Hierro + Acido Folico x30","cantidad":1,"precio":19000}]',43000,'daviplata','pagado','FAC-COMP-0021','2025-03-03 11:00:00'),
(22,23,'[{"producto_id":28,"nombre":"Jabon antibacterial 250ml","cantidad":2,"precio":12000}]',24000,'efectivo','pagado','FAC-COMP-0022','2025-03-05 14:00:00'),
(23,24,'[{"producto_id":36,"nombre":"Condon Prudence Fresa x3","cantidad":2,"precio":11000}]',22000,'tarjeta','pagado','FAC-COMP-0023','2025-03-08 10:00:00'),
(24,25,'[{"producto_id":44,"nombre":"Lubricante Nuei Delay 100ml","cantidad":1,"precio":38000}]',38000,'nequi','pagado','FAC-COMP-0024','2025-03-10 11:30:00'),
(25,26,'[{"producto_id":6,"nombre":"Meloxicam 15mg x10","cantidad":1,"precio":5200}]',5200,'efectivo','pagado','FAC-COMP-0025','2025-03-12 09:00:00'),
(26,27,'[{"producto_id":13,"nombre":"Clindamicina 300mg x16","cantidad":1,"precio":28000}]',28000,'tarjeta','pagado','FAC-COMP-0026','2025-03-15 10:30:00'),
(27,28,'[{"producto_id":24,"nombre":"Magnesio 400mg x60","cantidad":1,"precio":32000}]',32000,'daviplata','pagado','FAC-COMP-0027','2025-03-18 11:00:00'),
(28,29,'[{"producto_id":29,"nombre":"Hilo dental 50m","cantidad":2,"precio":8500}]',17000,'efectivo','pagado','FAC-COMP-0028','2025-03-20 09:30:00'),
(29,30,'[{"producto_id":37,"nombre":"Condon Control Retard x3","cantidad":2,"precio":14500}]',29000,'tarjeta','pagado','FAC-COMP-0029','2025-03-22 14:00:00'),
(30,31,'[{"producto_id":45,"nombre":"Lubricante Yes OB Natural 80ml","cantidad":1,"precio":52000}]',52000,'nequi','pagado','FAC-COMP-0030','2025-03-25 10:00:00'),
(31,32,'[{"producto_id":7,"nombre":"Tramadol 50mg x10","cantidad":1,"precio":7800}]',7800,'efectivo','pagado','FAC-COMP-0031','2025-04-01 11:00:00'),
(32,33,'[{"producto_id":14,"nombre":"Claritromicina 500mg x14","cantidad":1,"precio":35000}]',35000,'tarjeta','pagado','FAC-COMP-0032','2025-04-03 09:30:00'),
(33,34,'[{"producto_id":30,"nombre":"Crema dental blanqueadora 75ml","cantidad":2,"precio":14000}]',28000,'daviplata','pagado','FAC-COMP-0033','2025-04-05 10:00:00'),
(34,35,'[{"producto_id":38,"nombre":"Condon Lifestyles Ultra x12","cantidad":1,"precio":35000}]',35000,'efectivo','pagado','FAC-COMP-0034','2025-04-08 11:30:00'),
(35,36,'[{"producto_id":46,"nombre":"Lubricante Vive Sensitivo 50ml","cantidad":1,"precio":25000}]',25000,'tarjeta','pagado','FAC-COMP-0035','2025-04-10 09:00:00'),
(36,37,'[{"producto_id":8,"nombre":"Ketorolaco 10mg x10","cantidad":1,"precio":6500}]',6500,'nequi','pagado','FAC-COMP-0036','2025-04-12 14:00:00'),
(37,38,'[{"producto_id":15,"nombre":"Cefalexina 500mg x20","cantidad":1,"precio":19500}]',19500,'efectivo','pagado','FAC-COMP-0037','2025-04-15 10:30:00'),
(38,39,'[{"producto_id":31,"nombre":"Desodorante roll-on 50ml","cantidad":2,"precio":18000}]',36000,'tarjeta','pagado','FAC-COMP-0038','2025-04-18 11:00:00'),
(39,40,'[{"producto_id":39,"nombre":"Condon Vive Placer Real x3","cantidad":3,"precio":10500}]',31500,'daviplata','pagado','FAC-COMP-0039','2025-04-20 09:30:00'),
(40,41,'[{"producto_id":47,"nombre":"Lubricante Prudence Aqua 60ml","cantidad":1,"precio":22000}]',22000,'efectivo','pagado','FAC-COMP-0040','2025-04-22 14:00:00'),
(41,2,'[{"producto_id":1,"nombre":"Acetaminofen 500mg x10","cantidad":3,"precio":2500},{"producto_id":9,"nombre":"Amoxicilina 500mg x21","cantidad":1,"precio":18500}]',26000,'tarjeta','pagado','FAC-COMP-0041','2025-04-25 10:00:00'),
(42,3,'[{"producto_id":17,"nombre":"Vitamina C 1000mg x30","cantidad":1,"precio":18000}]',18000,'nequi','pagado','FAC-COMP-0042','2025-04-28 11:30:00'),
(43,4,'[{"producto_id":33,"nombre":"Condon Durex Natural x3","cantidad":2,"precio":12000}]',24000,'efectivo','pagado','FAC-COMP-0043','2025-05-01 09:00:00'),
(44,5,'[{"producto_id":41,"nombre":"Lubricante Durex Play 50ml","cantidad":1,"precio":28000}]',28000,'tarjeta','pagado','FAC-COMP-0044','2025-05-03 14:00:00'),
(45,6,'[{"producto_id":2,"nombre":"Ibuprofeno 400mg x10","cantidad":4,"precio":3200}]',12800,'efectivo','pagado','FAC-COMP-0045','2025-05-05 10:30:00'),
(46,7,'[{"producto_id":25,"nombre":"Protector solar SPF 50 50ml","cantidad":1,"precio":35000},{"producto_id":32,"nombre":"Gel antibacterial 500ml","cantidad":1,"precio":16000}]',51000,'daviplata','pagado','FAC-COMP-0046','2025-05-08 11:00:00'),
(47,8,'[{"producto_id":10,"nombre":"Azitromicina 500mg x3","cantidad":1,"precio":22000}]',22000,'tarjeta','pagado','FAC-COMP-0047','2025-05-10 09:30:00'),
(48,9,'[{"producto_id":20,"nombre":"Omega 3 1000mg x30","cantidad":1,"precio":28000}]',28000,'nequi','pagado','FAC-COMP-0048','2025-05-12 14:00:00'),
(49,10,'[{"producto_id":34,"nombre":"Condon Durex Extra Fino x3","cantidad":3,"precio":13500}]',40500,'efectivo','pagado','FAC-COMP-0049','2025-05-14 10:00:00'),
(50,11,'[{"producto_id":42,"nombre":"Lubricante Intimo KY 75ml","cantidad":1,"precio":32000}]',32000,'tarjeta','pagado','FAC-COMP-0050','2025-05-15 11:30:00'),
(51,12,'[{"producto_id":5,"nombre":"Diclofenaco 50mg x10","cantidad":2,"precio":3600}]',7200,'efectivo','pendiente',NULL,'2025-05-17 09:00:00'),
(52,13,'[{"producto_id":13,"nombre":"Clindamicina 300mg x16","cantidad":1,"precio":28000}]',28000,'tarjeta','pendiente',NULL,'2025-05-18 10:30:00'),
(53,14,'[{"producto_id":21,"nombre":"Calcio + Vitamina D x60","cantidad":1,"precio":24000}]',24000,'nequi','pendiente',NULL,'2025-05-19 11:00:00'),
(54,15,'[{"producto_id":27,"nombre":"Crema hidratante facial 50ml","cantidad":1,"precio":42000}]',42000,'daviplata','cancelado',NULL,'2025-05-16 09:30:00'),
(55,16,'[{"producto_id":36,"nombre":"Condon Prudence Fresa x3","cantidad":2,"precio":11000}]',22000,'efectivo','cancelado',NULL,'2025-05-15 14:00:00');
"@ "bloque4"
Write-Host "   ??? OK" -ForegroundColor Green

# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
# 5. PAGOS, NOTIFICACIONES Y AUDITORIA
# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
Write-Host "5/6  Pagos, notificaciones y auditoria..." -ForegroundColor Yellow

Ejecutar-SQL @"
USE drgueria_pagos;
INSERT IGNORE INTO transacciones (compra_id,usuario_id,monto,estado,metodo_pago,numero_factura,createdAt) VALUES
(1,2,5000,'aprobado','efectivo','FAC-PAG-0001','2025-01-10 10:31:00'),
(2,3,18500,'aprobado','tarjeta','FAC-PAG-0002','2025-01-12 11:01:00'),
(3,4,58000,'aprobado','efectivo','FAC-PAG-0003','2025-01-15 14:01:00'),
(4,5,35000,'aprobado','tarjeta','FAC-PAG-0004','2025-01-18 09:31:00'),
(5,6,36000,'aprobado','efectivo','FAC-PAG-0005','2025-01-20 16:01:00'),
(6,7,28000,'aprobado','nequi','FAC-PAG-0006','2025-01-22 12:01:00'),
(7,8,11200,'aprobado','efectivo','FAC-PAG-0007','2025-01-25 10:01:00'),
(8,9,22000,'aprobado','tarjeta','FAC-PAG-0008','2025-01-28 11:31:00'),
(9,10,56000,'aprobado','daviplata','FAC-PAG-0009','2025-02-01 09:01:00'),
(10,11,22000,'aprobado','efectivo','FAC-PAG-0010','2025-02-03 14:31:00'),
(11,12,27000,'aprobado','tarjeta','FAC-PAG-0011','2025-02-05 10:01:00'),
(12,13,32000,'aprobado','nequi','FAC-PAG-0012','2025-02-08 11:01:00'),
(13,14,5400,'aprobado','efectivo','FAC-PAG-0013','2025-02-10 09:31:00'),
(14,15,15800,'aprobado','tarjeta','FAC-PAG-0014','2025-02-12 12:01:00'),
(15,16,48000,'aprobado','daviplata','FAC-PAG-0015','2025-02-15 10:01:00'),
(16,17,42000,'aprobado','efectivo','FAC-PAG-0016','2025-02-18 11:31:00'),
(17,18,38000,'aprobado','tarjeta','FAC-PAG-0017','2025-02-20 09:01:00'),
(18,19,45000,'aprobado','nequi','FAC-PAG-0018','2025-02-22 14:01:00'),
(19,20,7200,'aprobado','efectivo','FAC-PAG-0019','2025-02-25 10:31:00'),
(20,21,12000,'aprobado','tarjeta','FAC-PAG-0020','2025-03-01 09:01:00'),
(21,22,43000,'aprobado','daviplata','FAC-PAG-0021','2025-03-03 11:01:00'),
(22,23,24000,'aprobado','efectivo','FAC-PAG-0022','2025-03-05 14:01:00'),
(23,24,22000,'aprobado','tarjeta','FAC-PAG-0023','2025-03-08 10:01:00'),
(24,25,38000,'aprobado','nequi','FAC-PAG-0024','2025-03-10 11:31:00'),
(25,26,5200,'aprobado','efectivo','FAC-PAG-0025','2025-03-12 09:01:00'),
(26,27,28000,'aprobado','tarjeta','FAC-PAG-0026','2025-03-15 10:31:00'),
(27,28,32000,'aprobado','daviplata','FAC-PAG-0027','2025-03-18 11:01:00'),
(28,29,17000,'aprobado','efectivo','FAC-PAG-0028','2025-03-20 09:31:00'),
(29,30,29000,'aprobado','tarjeta','FAC-PAG-0029','2025-03-22 14:01:00'),
(30,31,52000,'aprobado','nequi','FAC-PAG-0030','2025-03-25 10:01:00'),
(31,32,7800,'aprobado','efectivo','FAC-PAG-0031','2025-04-01 11:01:00'),
(32,33,35000,'aprobado','tarjeta','FAC-PAG-0032','2025-04-03 09:31:00'),
(33,34,28000,'aprobado','daviplata','FAC-PAG-0033','2025-04-05 10:01:00'),
(34,35,35000,'aprobado','efectivo','FAC-PAG-0034','2025-04-08 11:31:00'),
(35,36,25000,'aprobado','tarjeta','FAC-PAG-0035','2025-04-10 09:01:00'),
(36,37,6500,'aprobado','nequi','FAC-PAG-0036','2025-04-12 14:01:00'),
(37,38,19500,'aprobado','efectivo','FAC-PAG-0037','2025-04-15 10:31:00'),
(38,39,36000,'aprobado','tarjeta','FAC-PAG-0038','2025-04-18 11:01:00'),
(39,40,31500,'aprobado','daviplata','FAC-PAG-0039','2025-04-20 09:31:00'),
(40,41,22000,'aprobado','efectivo','FAC-PAG-0040','2025-04-22 14:01:00'),
(41,2,26000,'aprobado','tarjeta','FAC-PAG-0041','2025-04-25 10:01:00'),
(42,3,18000,'aprobado','nequi','FAC-PAG-0042','2025-04-28 11:31:00'),
(43,4,24000,'aprobado','efectivo','FAC-PAG-0043','2025-05-01 09:01:00'),
(44,5,28000,'aprobado','tarjeta','FAC-PAG-0044','2025-05-03 14:01:00'),
(45,6,12800,'aprobado','efectivo','FAC-PAG-0045','2025-05-05 10:31:00'),
(46,7,51000,'aprobado','daviplata','FAC-PAG-0046','2025-05-08 11:01:00'),
(47,8,22000,'aprobado','tarjeta','FAC-PAG-0047','2025-05-10 09:31:00'),
(48,9,28000,'aprobado','nequi','FAC-PAG-0048','2025-05-12 14:01:00'),
(49,10,40500,'aprobado','efectivo','FAC-PAG-0049','2025-05-14 10:01:00'),
(50,11,32000,'aprobado','tarjeta','FAC-PAG-0050','2025-05-15 11:31:00'),
(51,12,7200,'pendiente','efectivo',NULL,'2025-05-17 09:01:00'),
(52,13,28000,'pendiente','tarjeta',NULL,'2025-05-18 10:31:00'),
(53,14,24000,'pendiente','nequi',NULL,'2025-05-19 11:01:00'),
(54,15,42000,'rechazado','daviplata',NULL,'2025-05-16 09:31:00'),
(55,16,22000,'rechazado','efectivo',NULL,'2025-05-15 14:01:00');
"@ "bloque5a"

Ejecutar-SQL @"
USE drgueria_notificaciones;
INSERT IGNORE INTO notificaciones (usuario_id,tipo,mensaje,leida,estado,referencia_id,referencia_tipo,fecha) VALUES
(2,'compra_exitosa','Tu compra #1 por valor de 5000 fue procesada exitosamente.',1,'enviada',1,'compra','2025-01-10 10:32:00'),
(3,'compra_exitosa','Tu compra #2 por valor de 18500 fue procesada exitosamente.',1,'enviada',2,'compra','2025-01-12 11:02:00'),
(4,'compra_exitosa','Tu compra #3 por valor de 58000 fue procesada exitosamente.',1,'enviada',3,'compra','2025-01-15 14:02:00'),
(5,'compra_exitosa','Tu compra #4 por valor de 35000 fue procesada exitosamente.',1,'enviada',4,'compra','2025-01-18 09:32:00'),
(6,'compra_exitosa','Tu compra #5 por valor de 36000 fue procesada exitosamente.',1,'enviada',5,'compra','2025-01-20 16:02:00'),
(7,'compra_exitosa','Tu compra #6 por valor de 28000 fue procesada exitosamente.',1,'enviada',6,'compra','2025-01-22 12:02:00'),
(8,'compra_exitosa','Tu compra #7 por valor de 11200 fue procesada exitosamente.',1,'enviada',7,'compra','2025-01-25 10:02:00'),
(9,'compra_exitosa','Tu compra #8 por valor de 22000 fue procesada exitosamente.',1,'enviada',8,'compra','2025-01-28 11:32:00'),
(10,'compra_exitosa','Tu compra #9 por valor de 56000 fue procesada exitosamente.',1,'enviada',9,'compra','2025-02-01 09:02:00'),
(11,'compra_exitosa','Tu compra #10 por valor de 22000 fue procesada exitosamente.',1,'enviada',10,'compra','2025-02-03 14:32:00'),
(12,'compra_exitosa','Tu compra #11 por valor de 27000 fue procesada exitosamente.',1,'enviada',11,'compra','2025-02-05 10:02:00'),
(13,'compra_exitosa','Tu compra #12 por valor de 32000 fue procesada exitosamente.',1,'enviada',12,'compra','2025-02-08 11:02:00'),
(14,'compra_exitosa','Tu compra #13 por valor de 5400 fue procesada exitosamente.',1,'enviada',13,'compra','2025-02-10 09:32:00'),
(15,'compra_exitosa','Tu compra #14 por valor de 15800 fue procesada exitosamente.',1,'enviada',14,'compra','2025-02-12 12:02:00'),
(16,'compra_exitosa','Tu compra #15 por valor de 48000 fue procesada exitosamente.',1,'enviada',15,'compra','2025-02-15 10:02:00'),
(17,'compra_exitosa','Tu compra #16 por valor de 42000 fue procesada exitosamente.',1,'enviada',16,'compra','2025-02-18 11:32:00'),
(18,'compra_exitosa','Tu compra #17 por valor de 38000 fue procesada exitosamente.',1,'enviada',17,'compra','2025-02-20 09:02:00'),
(19,'compra_exitosa','Tu compra #18 por valor de 45000 fue procesada exitosamente.',1,'enviada',18,'compra','2025-02-22 14:02:00'),
(20,'compra_exitosa','Tu compra #19 por valor de 7200 fue procesada exitosamente.',1,'enviada',19,'compra','2025-02-25 10:32:00'),
(21,'compra_exitosa','Tu compra #20 por valor de 12000 fue procesada exitosamente.',1,'enviada',20,'compra','2025-03-01 09:02:00'),
(2,'compra_exitosa','Tu compra #41 por valor de 26000 fue procesada exitosamente.',1,'enviada',41,'compra','2025-04-25 10:02:00'),
(3,'compra_exitosa','Tu compra #42 por valor de 18000 fue procesada exitosamente.',1,'enviada',42,'compra','2025-04-28 11:32:00'),
(12,'pago_pendiente','Tu pago de la compra #51 esta pendiente de confirmacion.',0,'enviada',51,'compra','2025-05-17 09:02:00'),
(13,'pago_pendiente','Tu pago de la compra #52 esta pendiente de confirmacion.',0,'enviada',52,'compra','2025-05-18 10:32:00'),
(14,'pago_pendiente','Tu pago de la compra #53 esta pendiente de confirmacion.',0,'enviada',53,'compra','2025-05-19 11:02:00'),
(15,'pago_rechazado','Tu pago de la compra #54 fue rechazado. Intenta de nuevo.',0,'enviada',54,'compra','2025-05-16 09:32:00'),
(16,'pago_rechazado','Tu pago de la compra #55 fue rechazado. Intenta de nuevo.',0,'enviada',55,'compra','2025-05-15 14:02:00'),
(1,'stock_bajo','El producto Acetaminofen 500mg x10 requiere reabastecimiento.',0,'enviada',1,'producto','2025-05-19 08:00:00'),
(1,'nuevo_pedido','Nuevo pedido FAC-PED-0053 generado para proveedor Genfar.',0,'enviada',53,'pedido','2025-05-28 09:01:00');
"@ "bloque5b"

Ejecutar-SQL @"
USE drgueria_auditoria;
INSERT IGNORE INTO logs (servicio,accion,usuario_id,detalle,fecha) VALUES
('ms-usuarios','LOGIN',2,'Usuario admin@gmail.com inicio sesion','2025-01-10 10:28:00'),
('ms-usuarios','LOGIN',3,'Usuario cliente@gmail.com inicio sesion','2025-01-12 10:58:00'),
('ms-compras','COMPRA_CREADA',2,'Compra #1 creada por valor de 5000','2025-01-10 10:30:00'),
('ms-pagos','PAGO_APROBADO',2,'Pago aprobado compra #1 valor 5000','2025-01-10 10:31:00'),
('ms-compras','COMPRA_CREADA',3,'Compra #2 creada por valor de 18500','2025-01-12 11:00:00'),
('ms-pagos','PAGO_APROBADO',3,'Pago aprobado compra #2 valor 18500','2025-01-12 11:01:00'),
('ms-productos','STOCK_REDUCIDO',1,'Stock producto 1 reducido en 2 unidades','2025-01-10 10:30:00'),
('ms-productos','STOCK_REDUCIDO',1,'Stock producto 9 reducido en 1 unidad','2025-01-12 11:00:00'),
('ms-usuarios','REGISTRO',4,'Nuevo usuario: mfernanda@gmail.com','2025-01-14 09:00:00'),
('ms-usuarios','REGISTRO',5,'Nuevo usuario: jcrestrepo@gmail.com','2025-01-14 09:05:00'),
('ms-compras','COMPRA_CREADA',4,'Compra #3 creada por valor de 58000','2025-01-15 14:00:00'),
('ms-pagos','PAGO_APROBADO',4,'Pago aprobado compra #3 valor 58000','2025-01-15 14:01:00'),
('ms-compras','COMPRA_CREADA',5,'Compra #4 creada por valor de 35000','2025-01-18 09:30:00'),
('ms-pagos','PAGO_APROBADO',5,'Pago aprobado compra #4 valor 35000','2025-01-18 09:31:00'),
('ms-proveedores','PEDIDO_CREADO',1,'Pedido FAC-PED-0001 creado para proveedor 1','2025-01-05 09:00:00'),
('ms-proveedores','PEDIDO_ENTREGADO',1,'Pedido FAC-PED-0001 marcado entregado','2025-01-10 14:00:00'),
('ms-compras','COMPRA_CANCELADA',15,'Compra #54 cancelada por usuario 15','2025-05-16 09:30:00'),
('ms-pagos','PAGO_RECHAZADO',15,'Pago rechazado compra #54 valor 42000','2025-05-16 09:31:00'),
('ms-compras','COMPRA_CANCELADA',16,'Compra #55 cancelada por usuario 16','2025-05-15 14:00:00'),
('ms-pagos','PAGO_RECHAZADO',16,'Pago rechazado compra #55 valor 22000','2025-05-15 14:01:00'),
('ms-usuarios','LOGIN',1,'Admin inicio sesion','2025-05-19 08:00:00'),
('ms-productos','PRODUCTO_EDITADO',1,'Stock actualizado producto 1','2025-05-19 08:05:00'),
('ms-reportes','REPORTE_GENERADO',1,'Reporte mensual mayo 2025','2025-05-19 08:10:00'),
('ms-auditoria','CONSULTA_LOGS',1,'Admin consulto logs del sistema','2025-05-19 08:15:00');
"@ "bloque5c"
Write-Host "   ??? OK" -ForegroundColor Green

# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
# 6. VERIFICACI??N FINAL
# ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
Write-Host ""
Write-Host "6/6  Verificando totales..." -ForegroundColor Yellow
kubectl exec -i $mysqlPod -n drgueria -- mysql -u root -pdrgueria2024 -e "
SELECT 'usuarios'        as tabla, COUNT(*) as total FROM drgueria_usuarios.usuarios
UNION ALL SELECT 'productos',      COUNT(*) FROM drgueria_productos.productos
UNION ALL SELECT 'proveedores',    COUNT(*) FROM drgueria_proveedores.proveedores
UNION ALL SELECT 'pedidos',        COUNT(*) FROM drgueria_proveedores.pedidos
UNION ALL SELECT 'compras',        COUNT(*) FROM drgueria_compras.compras
UNION ALL SELECT 'transacciones',  COUNT(*) FROM drgueria_pagos.transacciones
UNION ALL SELECT 'notificaciones', COUNT(*) FROM drgueria_notificaciones.notificaciones
UNION ALL SELECT 'logs_auditoria', COUNT(*) FROM drgueria_auditoria.logs;
" 2>&1 | Where-Object { $_ -notmatch "Warning" }

Write-Host ""
Write-Host "????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????" -ForegroundColor Green



