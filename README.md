# 💊 DRGUERIA — Sistema de Gestión Farmacéutica

Sistema web de gestión de ventas e inventario para droguería, desarrollado con arquitectura de **microservicios**. Permite a clientes comprar productos en línea y a administradores gestionar inventario, proveedores y pedidos con alertas automáticas de stock bajo.

> Proyecto desarrollado por **Valeria Gómez Collazos** y **Gustavo Coque Alegría**

---

## 🏗️ Arquitectura

```
Frontend (Apache) → API Gateway :4000 → MS Usuarios   :3000 → DB: drgueria_usuarios
                                       → MS Productos  :3001 → DB: drgueria_productos
                                       → MS Proveedores:3002 → DB: drgueria_proveedores
```

| Componente       | Tecnología                        | Puerto |
|------------------|-----------------------------------|--------|
| Frontend         | HTML, CSS, JavaScript (Apache)    | 80     |
| API Gateway      | Node.js + Express + http-proxy-middleware | 4000 |
| MS Usuarios      | Node.js + Express + Sequelize + JWT | 3000 |
| MS Productos     | Node.js + Express + Sequelize + Axios | 3001 |
| MS Proveedores   | Node.js + Express + Sequelize + Axios | 3002 |
| Base de datos    | MySQL                             | 3307   |

---

## 📁 Estructura del repositorio

```
drgueria/
├── frontend/
│   ├── index.html
│   ├── catalogo.html
│   ├── dashboard.html
│   ├── productos.html
│   ├── proveedores.html
│   ├── pedidos.html
│   └── usuarios.html
├── api-gateway/
│   ├── index.js
│   ├── package.json
│   └── .env
├── ms-usuarios/
│   ├── index.js
│   ├── package.json
│   └── .env
├── ms-productos/
│   ├── index.js
│   ├── package.json
│   └── .env
└── ms-proveedores/
    ├── index.js
    ├── package.json
    └── .env
```

---

## ⚙️ Variables de entorno

Cada microservicio tiene su propio archivo `.env`. A continuación están los valores por defecto del proyecto. **Revisa la sección "¿Qué debes cambiar?" antes de correr el proyecto.**

### `api-gateway/.env`
```env
PORT=4000
MS_USUARIOS_URL=http://localhost:3000
MS_PRODUCTOS_URL=http://localhost:3001
MS_PROVEEDORES_URL=http://localhost:3002
```

### `ms-usuarios/.env`
```env
PORT=3000
DB_NAME=drgueria_usuarios
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3307
JWT_SECRET=drgueria_secreto_2024
```

### `ms-productos/.env`
```env
PORT=3001
DB_NAME=drgueria_productos
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3307
MS_PROVEEDORES_URL=http://localhost:3002
```

### `ms-proveedores/.env`
```env
PORT=3002
DB_NAME=drgueria_proveedores
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3307
MS_PRODUCTOS_URL=http://localhost:3001
```

---

## 🔧 ¿Qué debes cambiar?

| Variable | Dónde | Cambiar si... |
|----------|-------|---------------|
| `DB_PASSWORD` | Todos los `.env` de microservicios | Tu MySQL tiene contraseña |
| `DB_USER` | Todos los `.env` de microservicios | No usas el usuario `root` |
| `DB_HOST` | Todos los `.env` de microservicios | MySQL corre en otra máquina |
| `DB_PORT` | Todos los `.env` de microservicios | Tu MySQL usa el puerto estándar `3306` en vez de `3307` |
| `JWT_SECRET` | `ms-usuarios/.env` | Quieres un secreto más seguro en producción |
| URL del API Gateway en el frontend | Todos los archivos `.html` del frontend | Cambias el puerto del gateway o usas otro servidor |

### 🌐 URL del API Gateway en el frontend

El frontend apunta al API Gateway en esta dirección:

```
http://192.168.100.2:4000
```

Si corres el proyecto en tu máquina local, reemplaza esa IP por `localhost`:

```
http://localhost:4000
```

Busca y reemplaza `http://192.168.100.2:4000` en todos los archivos `.html` del frontend.

---

## 🚀 Instalación y ejecución

### Requisitos previos
- Node.js v18+
- MySQL corriendo en el puerto `3307` (o el que configures en `.env`)
- Las bases de datos creadas: `drgueria_usuarios`, `drgueria_productos`, `drgueria_proveedores`

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/drgueria.git
cd drgueria
```

### 2. Instalar dependencias de cada microservicio

```bash
cd api-gateway && npm install && cd ..
cd ms-usuarios && npm install && cd ..
cd ms-productos && npm install && cd ..
cd ms-proveedores && npm install && cd ..
```

### 3. Configurar los `.env`

Revisa y edita cada `.env` según tu entorno local (contraseña de MySQL, puertos, etc.).

### 4. Iniciar los microservicios

Abre **4 terminales** y ejecuta uno en cada una:

```bash
# Terminal 1 — MS Usuarios
cd ms-usuarios && node index.js

# Terminal 2 — MS Productos
cd ms-productos && node index.js

# Terminal 3 — MS Proveedores
cd ms-proveedores && node index.js

# Terminal 4 — API Gateway
cd api-gateway && node index.js
```

### 5. Abrir el frontend

Abre `frontend/index.html` desde tu servidor Apache, o directamente en el navegador si estás en desarrollo local.

---

## 👤 Roles de usuario

| Rol | Puede hacer |
|-----|-------------|
| **Cliente** | Ver catálogo, filtrar productos, realizar compras |
| **Administrador** | Todo lo anterior + gestionar productos, proveedores, pedidos, usuarios y ver alertas de stock |

---

## 📡 Endpoints principales

### MS Usuarios (`/usuarios`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/usuarios` | Crear usuario |
| POST | `/usuarios/login` | Iniciar sesión |
| GET | `/usuarios` | Listar usuarios |
| PUT | `/usuarios/:id` | Actualizar usuario |
| DELETE | `/usuarios/:id` | Eliminar usuario |

### MS Productos (`/productos`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/productos` | Listar productos |
| POST | `/productos` | Crear producto |
| POST | `/productos/:id/comprar` | Realizar compra |
| GET | `/productos/alertas` | Ver alertas de stock bajo |
| PUT | `/productos/:id/stock` | Recargar stock |

### MS Proveedores (`/proveedores` y `/pedidos`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/proveedores` | Listar proveedores |
| GET | `/pedidos` | Listar pedidos |
| PUT | `/pedidos/:id` | Cambiar estado del pedido |
| DELETE | `/pedidos/:id` | Eliminar pedido |