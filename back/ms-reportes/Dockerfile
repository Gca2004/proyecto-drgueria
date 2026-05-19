# ══════════════════════════════════════════════════════════
# ms-reportes — Node.js + Python + PySpark + Matplotlib
# ══════════════════════════════════════════════════════════
FROM node:20-bookworm-slim

WORKDIR /app

# ── Instalar Java (requerido por PySpark) + Python + libs ──
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    default-jdk-headless \
    fonts-dejavu-core \
    && pip3 install --break-system-packages --no-cache-dir \
        pyspark==3.5.1 \
        pandas \
        matplotlib \
        seaborn \
        numpy \
        pillow \
        reportlab \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Instalar dependencias Node ──────────────────────────────
COPY package*.json ./
RUN npm install --omit=dev

# ── Copiar código fuente ────────────────────────────────────
COPY . .

EXPOSE 3007
CMD ["node", "src/index.js"]
