USE drgueria_productos;
 
INSERT INTO productos (nombre_producto, categoria, precio, stock_actual, stock_minimo) VALUES
 

('Acetaminofén 500mg x10', 'Analgésico', 2500, 100, 25),
('Ibuprofeno 400mg x10', 'Analgésico', 3200, 100, 25),
('Naproxeno 500mg x10', 'Analgésico', 4800, 100, 25),
('Aspirina 100mg x10', 'Analgésico', 1800, 100, 25),
('Diclofenaco 50mg x10', 'Analgésico', 3600, 100, 25),
('Meloxicam 15mg x10', 'Analgésico', 5200, 100, 25),
('Tramadol 50mg x10', 'Analgésico', 7800, 100, 25),
('Ketorolaco 10mg x10', 'Analgésico', 6500, 100, 25),
 

('Amoxicilina 500mg x21', 'Antibiótico', 18500, 100, 25),
('Azitromicina 500mg x3', 'Antibiótico', 22000, 100, 25),
('Ciprofloxacino 500mg x10', 'Antibiótico', 15800, 100, 25),
('Metronidazol 500mg x14', 'Antibiótico', 12000, 100, 25),
('Clindamicina 300mg x16', 'Antibiótico', 28000, 100, 25),
('Claritromicina 500mg x14', 'Antibiótico', 35000, 100, 25),
('Cefalexina 500mg x20', 'Antibiótico', 19500, 100, 25),
('Doxiciclina 100mg x10', 'Antibiótico', 14000, 100, 25),
 
('Vitamina C 1000mg x30', 'Vitaminas y suplementos', 18000, 100, 25),
('Vitamina D3 2000UI x30', 'Vitaminas y suplementos', 22000, 100, 25),
('Complejo B x30', 'Vitaminas y suplementos', 16500, 100, 25),
('Omega 3 1000mg x30', 'Vitaminas y suplementos', 28000, 100, 25),
('Calcio + Vitamina D x60', 'Vitaminas y suplementos', 24000, 100, 25),
('Zinc 50mg x30', 'Vitaminas y suplementos', 15000, 100, 25),
('Hierro + Ácido Fólico x30', 'Vitaminas y suplementos', 19000, 100, 25),
('Magnesio 400mg x60', 'Vitaminas y suplementos', 32000, 100, 25),
 
('Protector solar SPF 50 50ml', 'Cuidado personal', 35000, 100, 25),
('Shampoo anticaspa 400ml', 'Cuidado personal', 22000, 100, 25),
('Crema hidratante facial 50ml', 'Cuidado personal', 42000, 100, 25),
('Jabón antibacterial 250ml', 'Cuidado personal', 12000, 100, 25),
('Hilo dental 50m', 'Cuidado personal', 8500, 100, 25),
('Crema dental blanqueadora 75ml', 'Cuidado personal', 14000, 100, 25),
('Desodorante roll-on 50ml', 'Cuidado personal', 18000, 100, 25),
('Gel antibacterial 500ml', 'Cuidado personal', 16000, 100, 25),
 
('Condón Durex Natural x3', 'Condones', 12000, 100, 25),
('Condón Durex Extra Fino x3', 'Condones', 13500, 100, 25),
('Condón Condomi Ultra x12', 'Condones', 38000, 100, 25),
('Condón Prudence Fresa x3', 'Condones', 11000, 100, 25),
('Condón Control Retard x3', 'Condones', 14500, 100, 25),
('Condón Lifestyles Ultra x12', 'Condones', 35000, 100, 25),
('Condón Vive Placer Real x3', 'Condones', 10500, 100, 25),
('Condón Protex x12', 'Condones', 32000, 100, 25),
 
('Lubricante Durex Play 50ml', 'Lubricantes', 28000, 100, 25),
('Lubricante Íntimo KY 75ml', 'Lubricantes', 32000, 100, 25),
('Lubricante Pjur Original 30ml', 'Lubricantes', 45000, 100, 25),
('Lubricante Nuei Delay 100ml', 'Lubricantes', 38000, 100, 25),
('Lubricante Yes OB Natural 80ml', 'Lubricantes', 52000, 100, 25),
('Lubricante Vive Sensitivo 50ml', 'Lubricantes', 25000, 100, 25),
('Lubricante Prudence Aqua 60ml', 'Lubricantes', 22000, 100, 25),
('Lubricante Control Aqua 75ml', 'Lubricantes', 29000, 100, 25);
 

USE drgueria_proveedores;
 
INSERT INTO proveedores (nombre, contacto, telefono, categoria) VALUES
('Laboratorios Lafrancol S.A.S', 'Carlos Andrés Restrepo', '6024567890', 'Analgésico'),
('Genfar S.A - Grupo Sanofi', 'María Claudia Ospina', '6013456789', 'Antibiótico'),
('Tecnoquímicas S.A', 'Juan David Mejía', '6023456789', 'Vitaminas y suplementos'),
('Bayer S.A Colombia', 'Adriana Morales Vargas', '6012345678', 'Cuidado personal'),
('Distribuidora Íntima de Colombia S.A.S', 'Jorge Iván Pérez', '3112345678', 'Condones'),
('Laboratorios Siegfried Colombia S.A', 'Sandra Milena López', '6024123456', 'Lubricantes');
