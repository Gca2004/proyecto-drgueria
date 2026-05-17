import csv
import json
import os
import sys


def safe_float(value):
    try:
        return float(value)
    except Exception:
        return 0.0


def safe_int(value):
    try:
        return int(value)
    except Exception:
        return 0


def index_by(items, key):
    data = {}
    for item in items:
        if key in item:
            data[item[key]] = item
    return data


def parse_detalle(detalle):
    if isinstance(detalle, dict):
        return detalle
    if not detalle:
        return {}
    try:
        return json.loads(detalle)
    except Exception:
        return {}


def main():
    if len(sys.argv) < 3:
        raise SystemExit("Uso: python generar_dataset.py <snapshot.json> <dataset.csv>")

    snapshot_path = sys.argv[1]
    dataset_path = sys.argv[2]

    with open(snapshot_path, "r", encoding="utf-8") as fh:
      snapshot = json.load(fh)

    productos = snapshot.get("productos", [])
    proveedores = snapshot.get("proveedores", [])
    pedidos = snapshot.get("pedidos", [])
    pagos = snapshot.get("pagos", [])
    usuarios = snapshot.get("usuarios", [])
    auditoria = snapshot.get("auditoria", [])

    productos_by_id = index_by(productos, "id_producto")
    proveedores_by_id = index_by(proveedores, "id_proveedor")
    usuarios_by_id = index_by(usuarios, "id_usuario")
    auditoria_by_usuario = {}

    for log in auditoria:
        usuario_id = log.get("usuario_id")
        if usuario_id is None:
            continue
        auditoria_by_usuario[usuario_id] = auditoria_by_usuario.get(usuario_id, 0) + 1

    fieldnames = [
        "compra_id",
        "usuario_id",
        "usuario_rol",
        "usuario_nombre",
        "producto_id",
        "producto_nombre",
        "categoria",
        "precio",
        "stock_actual",
        "stock_minimo",
        "proveedor_id",
        "proveedor_nombre",
        "cantidad_solicitada",
        "estado_pedido",
        "monto_pago",
        "estado_pago",
        "metodo_pago",
        "numero_factura",
        "logs_usuario",
        "fecha_referencia"
    ]

    compras_auditoria = []
    for log in auditoria:
        if str(log.get("accion", "")).lower() != "compra_realizada":
            continue
        detalle = parse_detalle(log.get("detalle"))
        compras_auditoria.append({
            "compra_id": log.get("id", ""),
            "usuario_id": log.get("usuario_id"),
            "producto_id": detalle.get("producto_id", ""),
            "producto_nombre": detalle.get("producto_nombre", ""),
            "categoria": detalle.get("categoria", ""),
            "cantidad": safe_int(detalle.get("cantidad", 0)),
            "precio_unitario": safe_float(detalle.get("precio_unitario", 0)),
            "monto_total": safe_float(detalle.get("monto_total", 0)),
            "stock_restante": safe_int(detalle.get("stock_restante", 0)),
            "fecha_referencia": log.get("fecha", snapshot.get("generado_en", ""))
        })

    rows = []

    for pago in pagos:
        compra_id = pago.get("compra_id")
        usuario_id = pago.get("usuario_id")
        pedido = next((item for item in pedidos if item.get("id_pedido") == compra_id), {})
        producto = productos_by_id.get(pedido.get("id_producto"), {})
        proveedor = proveedores_by_id.get(pedido.get("id_proveedor"), pedido.get("Proveedor", {}))
        usuario = usuarios_by_id.get(usuario_id, {})

        rows.append({
            "compra_id": compra_id,
            "usuario_id": usuario_id,
            "usuario_rol": usuario.get("rol", ""),
            "usuario_nombre": usuario.get("nombre", ""),
            "producto_id": pedido.get("id_producto", ""),
            "producto_nombre": producto.get("nombre_producto", pedido.get("nombre_producto", "")),
            "categoria": producto.get("categoria", pedido.get("categoria", "")),
            "precio": safe_float(producto.get("precio", 0)),
            "stock_actual": safe_int(producto.get("stock_actual", 0)),
            "stock_minimo": safe_int(producto.get("stock_minimo", 0)),
            "proveedor_id": pedido.get("id_proveedor", ""),
            "proveedor_nombre": proveedor.get("nombre", ""),
            "cantidad_solicitada": safe_int(pedido.get("cantidad_solicitada", 0)),
            "estado_pedido": pedido.get("estado_pedido", ""),
            "monto_pago": safe_float(pago.get("monto", 0)),
            "estado_pago": pago.get("estado", ""),
            "metodo_pago": pago.get("metodo_pago", ""),
            "numero_factura": pago.get("numero_factura", ""),
            "logs_usuario": auditoria_by_usuario.get(usuario_id, 0),
            "fecha_referencia": pago.get("createdAt", pedido.get("fecha_pedido", snapshot.get("generado_en", "")))
        })

    if not rows and compras_auditoria:
        for compra in compras_auditoria:
            usuario = usuarios_by_id.get(compra.get("usuario_id"), {})
            producto = productos_by_id.get(compra.get("producto_id"), {})
            rows.append({
                "compra_id": compra.get("compra_id", ""),
                "usuario_id": compra.get("usuario_id", ""),
                "usuario_rol": usuario.get("rol", ""),
                "usuario_nombre": usuario.get("nombre", ""),
                "producto_id": compra.get("producto_id", ""),
                "producto_nombre": compra.get("producto_nombre") or producto.get("nombre_producto", ""),
                "categoria": compra.get("categoria") or producto.get("categoria", ""),
                "precio": safe_float(compra.get("precio_unitario", producto.get("precio", 0))),
                "stock_actual": safe_int(compra.get("stock_restante", producto.get("stock_actual", 0))),
                "stock_minimo": safe_int(producto.get("stock_minimo", 0)),
                "proveedor_id": "",
                "proveedor_nombre": "",
                "cantidad_solicitada": safe_int(compra.get("cantidad", 0)),
                "estado_pedido": "compra_directa",
                "monto_pago": safe_float(compra.get("monto_total", 0)),
                "estado_pago": "registrado_auditoria",
                "metodo_pago": "sin_dato",
                "numero_factura": "",
                "logs_usuario": auditoria_by_usuario.get(compra.get("usuario_id"), 0),
                "fecha_referencia": compra.get("fecha_referencia", snapshot.get("generado_en", ""))
            })

    if not rows:
        for pedido in pedidos:
            producto = productos_by_id.get(pedido.get("id_producto"), {})
            proveedor = proveedores_by_id.get(pedido.get("id_proveedor"), pedido.get("Proveedor", {}))
            rows.append({
                "compra_id": pedido.get("id_pedido", ""),
                "usuario_id": "",
                "usuario_rol": "",
                "usuario_nombre": "",
                "producto_id": pedido.get("id_producto", ""),
                "producto_nombre": producto.get("nombre_producto", pedido.get("nombre_producto", "")),
                "categoria": producto.get("categoria", pedido.get("categoria", "")),
                "precio": safe_float(producto.get("precio", 0)),
                "stock_actual": safe_int(producto.get("stock_actual", 0)),
                "stock_minimo": safe_int(producto.get("stock_minimo", 0)),
                "proveedor_id": pedido.get("id_proveedor", ""),
                "proveedor_nombre": proveedor.get("nombre", ""),
                "cantidad_solicitada": safe_int(pedido.get("cantidad_solicitada", 0)),
                "estado_pedido": pedido.get("estado_pedido", ""),
                "monto_pago": 0.0,
                "estado_pago": "sin_pago",
                "metodo_pago": "",
                "numero_factura": "",
                "logs_usuario": 0,
                "fecha_referencia": pedido.get("fecha_pedido", snapshot.get("generado_en", ""))
            })

    os.makedirs(os.path.dirname(dataset_path), exist_ok=True)

    with open(dataset_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        if rows:
            writer.writerows(rows)

    print(f"Dataset generado correctamente en {dataset_path} con {len(rows)} registros.")


if __name__ == "__main__":
    main()
