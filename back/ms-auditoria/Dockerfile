# Imagen base - Node.js 20 Alpine (liviana)
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar package.json primero (aprovecha cache de Docker)
COPY package*.json ./

# Instalar solo dependencias de produccion
RUN npm install --omit=dev

# Copiar el resto del codigo fuente
COPY . .

# Exponer el puerto del microservicio
EXPOSE 3006

# Comando de inicio
CMD ["node", "src/index.js"]
