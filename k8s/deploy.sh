#!/bin/bash
# ══════════════════════════════════════════════════════════════
# deploy.sh — Despliega DRGUERIA completo en Minikube
#
# USO:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# PRERREQUISITOS:
#   - Minikube instalado y corriendo (minikube start)
#   - kubectl instalado
#   - Helm instalado
#   - Docker instalado
# ══════════════════════════════════════════════════════════════

set -e  # Detener si algún comando falla

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   DRGUERIA — Despliegue en Minikube          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── PASO 1: Verificar Minikube ──────────────────────────────
info "Verificando Minikube..."
minikube status | grep -q "Running" || error "Minikube no está corriendo. Ejecuta: minikube start --memory=4096 --cpus=4"
success "Minikube está corriendo"

# ── PASO 2: Habilitar addons necesarios ────────────────────
info "Habilitando addons de Minikube..."
minikube addons enable ingress
minikube addons enable metrics-server
success "Addons habilitados"

# ── PASO 3: Apuntar Docker al registro de Minikube ─────────
info "Configurando Docker para usar el registro de Minikube..."
eval $(minikube docker-env)
success "Docker apuntando a Minikube"

# ── PASO 4: Construir imágenes Docker ──────────────────────
info "Construyendo imágenes Docker..."
cd "$(dirname "$0")/../back"

SERVICES=(
  "api-gateway:api-gateway"
  "ms-usuarios:ms-usuarios"
  "ms-productos:ms-productos"
  "ms-proveedores:ms-proveedores"
  "ms-compras:ms-compras"
  "ms-pagos:ms-pagos"
  "ms-notificaciones:ms-notificaciones"
  "ms-auditoria:ms-auditoria"
  "ms-reportes:ms-reportes"
)

for entry in "${SERVICES[@]}"; do
  folder=$(echo $entry | cut -d: -f1)
  tag=$(echo $entry | cut -d: -f2)
  if [ -d "$folder" ]; then
    info "  Construyendo drgueria/${tag}:latest ..."
    docker build -t "drgueria/${tag}:latest" "./$folder" --quiet
    success "  drgueria/${tag}:latest construida"
  else
    warn "  Carpeta $folder no encontrada, saltando..."
  fi
done

# Frontend
if [ -d "front" ]; then
  info "  Construyendo drgueria/frontend:latest ..."
  docker build -t "drgueria/frontend:latest" "./front" --quiet
  success "  drgueria/frontend:latest construida"
fi

cd -

# ── PASO 5: Crear Namespace ────────────────────────────────
info "Creando namespace drgueria..."
kubectl apply -f k8s/namespace.yaml
success "Namespace creado"

# ── PASO 6: Aplicar Secret global ─────────────────────────
info "Aplicando secrets globales..."
kubectl apply -f k8s/global-secret.yaml
success "Secrets aplicados"

# ── PASO 7: Desplegar MySQL ────────────────────────────────
info "Desplegando MySQL..."
kubectl apply -f k8s/mysql/initdb-configmap.yaml
kubectl apply -f k8s/mysql/statefulset.yaml
info "  Esperando a que MySQL esté listo (puede tardar ~60s)..."
kubectl wait --for=condition=ready pod -l app=mysql -n drgueria --timeout=120s
success "MySQL listo"

# ── PASO 8: Desplegar microservicios ──────────────────────
info "Desplegando microservicios..."

MS_DIRS=(
  "k8s/ms-usuarios"
  "k8s/ms-productos"
  "k8s/ms-proveedores"
  "k8s/ms-compras"
  "k8s/ms-pagos"
  "k8s/ms-notificaciones"
  "k8s/ms-auditoria"
  "k8s/ms-reportes"
  "k8s/api-gateway"
  "k8s/frontend"
)

for dir in "${MS_DIRS[@]}"; do
  name=$(basename $dir)
  info "  Desplegando $name..."
  kubectl apply -f "$dir/"
  success "  $name aplicado"
done

# ── PASO 9: Aplicar Ingress ────────────────────────────────
info "Aplicando Ingress..."
kubectl apply -f k8s/ingress.yaml
success "Ingress aplicado"

# ── PASO 10: Instalar Prometheus + Grafana con Helm ────────
info "Instalando Prometheus + Grafana con Helm..."

# Agregar repositorio si no existe
helm repo list | grep -q "prometheus-community" || \
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

helm repo update

# Instalar solo si no está instalado
if ! helm list -n monitoring | grep -q "monitoring"; then
  helm install monitoring \
    prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --create-namespace \
    --set grafana.adminPassword=admin123 \
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
    --wait --timeout=300s
  success "Prometheus + Grafana instalados"
else
  warn "Prometheus ya estaba instalado, saltando..."
fi

# ── PASO 11: Aplicar ServiceMonitor ───────────────────────
info "Aplicando ServiceMonitor para scraping de métricas..."
kubectl apply -f k8s/monitoring/service-monitor.yaml
success "ServiceMonitor aplicado"

# ── PASO 12: Configurar /etc/hosts para acceso local ──────
MINIKUBE_IP=$(minikube ip)
info "IP de Minikube: ${MINIKUBE_IP}"
warn "Agrega esta línea a tu /etc/hosts (requiere sudo):"
echo ""
echo "  ${MINIKUBE_IP}  drgueria.local"
echo ""
echo "  Comando: echo '${MINIKUBE_IP}  drgueria.local' | sudo tee -a /etc/hosts"
echo ""

# ── PASO 13: Verificar estado final ───────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo "  Estado del despliegue"
echo "══════════════════════════════════════════════"
echo ""
info "Pods en namespace drgueria:"
kubectl get pods -n drgueria
echo ""
info "Services en namespace drgueria:"
kubectl get services -n drgueria
echo ""
info "HPA activos:"
kubectl get hpa -n drgueria 2>/dev/null || warn "HPAs aún no registrados (necesitan pods corriendo)"
echo ""

# ── URLs de acceso ─────────────────────────────────────────
echo "══════════════════════════════════════════════"
echo "  URLs de acceso"
echo "══════════════════════════════════════════════"
echo ""
echo "  Frontend:      http://drgueria.local"
echo "  API Gateway:   http://drgueria.local/v1"
echo ""
echo "  Grafana (port-forward):"
echo "  kubectl port-forward svc/monitoring-grafana 3000:80 -n monitoring"
echo "  → http://localhost:3000  (usuario: admin / contraseña: admin123)"
echo ""
echo "  Prometheus (port-forward):"
echo "  kubectl port-forward svc/monitoring-kube-prometheus-prometheus 9090:9090 -n monitoring"
echo "  → http://localhost:9090"
echo ""
success "¡Despliegue completado!"
