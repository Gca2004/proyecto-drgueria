# Imagen base — Node.js 20 Alpine (liviana)
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar package.json primero (aprovecha caché de Docker)
# Si package.json no cambia, no reinstala dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto (Docker lo documenta, no lo abre)
# Cada servicio lo sobreescribe en docker-compose con su puerto real
EXPOSE 3000

# Comando de inicio
CMD ["node", "src/index.js"]