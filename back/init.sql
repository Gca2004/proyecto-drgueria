

###MS usuarios
CREATE DATABASE IF NOT EXISTS drgueria_usuarios;
USE drgueria_usuarios;

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('cliente', 'administrador') DEFAULT 'cliente',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


### MS productos

CREATE DATABASE IF NOT EXISTS drgueria_productos;
USE drgueria_productos;

CREATE TABLE IF NOT EXISTS productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre_producto VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock_actual INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 5,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


###MS proveedores

CREATE DATABASE IF NOT EXISTS drgueria_proveedores;
USE drgueria_proveedores;

CREATE TABLE IF NOT EXISTS proveedores (
  id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  contacto VARCHAR(100),
  telefono VARCHAR(20),
  categoria VARCHAR(50) NOT NULL DEFAULT '',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


### MS pedidos

CREATE TABLE IF NOT EXISTS pedidos (
  id_pedido INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  id_proveedor INT NOT NULL,
  cantidad_solicitada INT NOT NULL,
  estado_pedido ENUM('aceptado','en proceso','entregado') DEFAULT 'aceptado',
  fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_entrega DATETIME,
  numero_factura VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

###carrito de compras del MS producto

USE drgueria_productos;
CREATE TABLE IF NOT EXISTS carrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_usuario_producto (usuario_id, producto_id)
);



### MS-PAGOS

CREATE DATABASE IF NOT EXISTS drgueria_pagos;
USE drgueria_pagos;

CREATE TABLE IF NOT EXISTS transacciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  compra_id INT NOT NULL,
  usuario_id INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  estado ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
  metodo_pago VARCHAR(50) DEFAULT 'efectivo',
  numero_factura VARCHAR(100) UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


### MS-AUDITORIA

CREATE DATABASE IF NOT EXISTS drgueria_auditoria;
USE drgueria_auditoria;

CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  servicio VARCHAR(100) NOT NULL,
  accion VARCHAR(100) NOT NULL,
  usuario_id INT,
  detalle TEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);


USE drgueria_productos;
 
INSERT INTO productos (nombre_producto, categoria, precio, stock_actual, stock_minimo) VALUES
 

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
 
INSERT INTO proveedores (nombre, contacto, telefono, categoria) VALUES
('Laboratorios Lafrancol S.A.S', 'Carlos Andres Restrepo', '6024567890', 'Analgesico'),
('Genfar S.A - Grupo Sanofi', 'Maria Claudia Ospina', '6013456789', 'Antibiotico'),
('Tecnoquimicas S.A', 'Juan David Mejia', '6023456789', 'Vitaminas y suplementos'),
('Bayer S.A Colombia', 'Adriana Morales Vargas', '6012345678', 'Cuidado personal'),
('Distribuidora Intima de Colombia S.A.S', 'Jorge Ivan Perez', '3112345678', 'Condones'),
('Laboratorios Siegfried Colombia S.A', 'Sandra Milena Lopez', '6024123456', 'Lubricantes');


###  MS-Compras
CREATE DATABASE IF NOT EXISTS drgueria_compras;
USE drgueria_compras;
CREATE TABLE IF NOT EXISTS compras (
  id_compra       INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT NOT NULL,
  items           TEXT NOT NULL,
  total           DECIMAL(12,2) NOT NULL,
  metodo_pago     VARCHAR(50) DEFAULT 'efectivo',
  estado          ENUM('pendiente','pagado','cancelado') DEFAULT 'pagado',
  numero_factura  VARCHAR(100) UNIQUE,
  id_transaccion  INT,
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

### MS-Notifiaciones

CREATE DATABASE IF NOT EXISTS drgueria_notificaciones;
USE drgueria_notificaciones;
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  tipo VARCHAR(50) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  estado ENUM('enviada', 'fallida') DEFAULT 'enviada',
  referencia_id INT,
  referencia_tipo VARCHAR(50),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
