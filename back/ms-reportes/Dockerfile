# Imagen base - Node.js con soporte para Python analitico
FROM node:20-bookworm-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar Python y dependencias analiticas
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && pip3 install --break-system-packages --no-cache-dir pandas pillow reportlab \
  && rm -rf /var/lib/apt/lists/*

# Copiar package.json primero (aprovecha cache de Docker)
COPY package*.json ./

# Instalar solo dependencias de produccion
RUN npm install --omit=dev

# Copiar el resto del codigo fuente
COPY . .

# Exponer el puerto del microservicio
EXPOSE 3007

# Comando de inicio
CMD ["node", "src/index.js"]
