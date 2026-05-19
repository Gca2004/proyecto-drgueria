import math
import os
import sys
from datetime import datetime

import pandas as pd
from pandas.errors import EmptyDataError
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


WIDTH = 1000
HEIGHT = 600
MARGIN = 70


def load_font(size):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        return ImageFont.load_default()


def draw_bar_chart(data, title, output_path, color):
    image = Image.new("RGB", (WIDTH, HEIGHT), "white")
    draw = ImageDraw.Draw(image)

    title_font = load_font(28)
    axis_font = load_font(18)
    value_font = load_font(16)

    draw.text((MARGIN, 20), title, fill="black", font=title_font)
    draw.line((MARGIN, HEIGHT - MARGIN, WIDTH - MARGIN, HEIGHT - MARGIN), fill="black", width=2)
    draw.line((MARGIN, MARGIN, MARGIN, HEIGHT - MARGIN), fill="black", width=2)

    if not data:
        draw.text((MARGIN, HEIGHT // 2), "No hay datos para graficar", fill="black", font=axis_font)
        image.save(output_path)
        return

    max_value = max(value for _, value in data) or 1
    chart_width = WIDTH - (MARGIN * 2)
    chart_height = HEIGHT - (MARGIN * 2)
    bar_width = max(40, int(chart_width / max(len(data), 1) * 0.55))
    gap = max(20, int((chart_width - (bar_width * len(data))) / max(len(data), 1)))

    x = MARGIN + gap // 2
    for label, value in data:
        bar_height = int((value / max_value) * (chart_height - 50))
        y1 = HEIGHT - MARGIN - bar_height
        y2 = HEIGHT - MARGIN
        draw.rectangle((x, y1, x + bar_width, y2), fill=color, outline="black")
        draw.text((x, y1 - 22), str(round(value, 2)), fill="black", font=value_font)
        draw.text((x, HEIGHT - MARGIN + 8), str(label), fill="black", font=axis_font)
        x += bar_width + gap

    image.save(output_path)


def draw_pie_like_chart(data, title, output_path):
    image = Image.new("RGB", (WIDTH, HEIGHT), "white")
    draw = ImageDraw.Draw(image)

    title_font = load_font(28)
    text_font = load_font(20)

    draw.text((MARGIN, 20), title, fill="black", font=title_font)

    total = sum(value for _, value in data) or 1
    colors = ["#1f77b4", "#2ca02c", "#ff7f0e", "#d62728", "#9467bd"]

    bbox = (150, 120, 550, 520)
    start_angle = 0

    for index, (label, value) in enumerate(data):
        angle = (value / total) * 360
        draw.pieslice(bbox, start=start_angle, end=start_angle + angle, fill=colors[index % len(colors)], outline="black")
        start_angle += angle

    legend_x = 620
    legend_y = 160
    for index, (label, value) in enumerate(data):
        color = colors[index % len(colors)]
        draw.rectangle((legend_x, legend_y, legend_x + 24, legend_y + 24), fill=color, outline="black")
        porcentaje = (value / total) * 100 if total else 0
        draw.text((legend_x + 36, legend_y), f"{label}: {value} ({porcentaje:.1f}%)", fill="black", font=text_font)
        legend_y += 44

    image.save(output_path)


def generate_pdf(pdf_path, resumen, png_files):
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 18)
    c.drawString(40, height - 50, "Reporte Analitico DRGUERIA")

    c.setFont("Helvetica", 11)
    c.drawString(40, height - 72, f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    y = height - 110
    for linea in resumen:
        c.drawString(40, y, linea)
        y -= 16

    for png_file in png_files:
        c.showPage()
        c.setFont("Helvetica-Bold", 14)
        c.drawString(40, height - 40, os.path.basename(png_file))
        c.drawImage(png_file, 40, 120, width=520, preserveAspectRatio=True, mask='auto')

    c.save()


def serie_top_o_default(serie, default_label="Ninguna", default_value=0):
    if serie is None or serie.empty:
        return default_label, default_value
    return serie.index[0], serie.iloc[0]


def main():
    if len(sys.argv) < 4:
        raise SystemExit("Uso: python analisis_drgueria.py <dataset.csv> <output_dir> <resultados.txt>")

    dataset_path = sys.argv[1]
    output_dir = sys.argv[2]
    resultados_path = sys.argv[3]

    os.makedirs(output_dir, exist_ok=True)

    try:
        df = pd.read_csv(dataset_path)
    except EmptyDataError:
        df = pd.DataFrame()

    if df.empty:
        resumen = [
            "Resumen general del analisis:",
            "- Registros analizados: 0",
            "- Ingresos aprobados: $0.00",
            "- Productos con stock bajo detectados en dataset: 0",
            "- Metodo de pago mas usado: sin_dato (0)",
            "- Estado de pedido dominante: sin_dato (0)",
            "- Categoria con mayor ingreso: sin_dato ($0.00)"
        ]

        with open(resultados_path, "w", encoding="utf-8") as fh:
            fh.write("Analisis DRGUERIA - resultados_spark.txt\n")
            fh.write(f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            for linea in resumen:
                fh.write(linea + "\n")

        pagos_png = os.path.join(output_dir, "pagos_por_metodo.png")
        pedidos_png = os.path.join(output_dir, "pedidos_por_estado.png")
        categorias_png = os.path.join(output_dir, "top_categorias_ingresos.png")
        pdf_path = os.path.join(output_dir, "reporte_drgueria.pdf")

        draw_pie_like_chart([("sin_dato", 1)], "Pagos por metodo", pagos_png)
        draw_bar_chart([("sin_dato", 0)], "Pedidos por estado", pedidos_png, "#2ca02c")
        draw_bar_chart([("sin_dato", 0)], "Top categorias por ingresos", categorias_png, "#ff7f0e")
        generate_pdf(pdf_path, resumen, [pagos_png, pedidos_png, categorias_png])
        print(f"Analisis completado sin registros. Se generaron archivos vacios en {output_dir}")
        return

    estados_ingreso = ["aprobado", "pagado", "registrado_auditoria"]
    ingresos_aprobados = df[df["estado_pago"].isin(estados_ingreso)]["monto_pago"].sum()
    pagos_por_metodo = df["metodo_pago"].fillna("sin_dato").replace("", "sin_dato").value_counts()
    pedidos_por_estado = df["estado_pedido"].fillna("sin_dato").replace("", "sin_dato").value_counts()
    categorias_limpias = df["categoria"].fillna("").replace("", "Ninguna")
    top_categorias = df.assign(categoria=categorias_limpias).groupby("categoria")["monto_pago"].sum().sort_values(ascending=False).head(5)
    stock_bajo = df[df["stock_actual"] < df["stock_minimo"]]["producto_nombre"].nunique()

    if not pagos_por_metodo.empty:
        metodo_top = pagos_por_metodo.index[0]
        metodo_total = pagos_por_metodo.iloc[0]
    else:
        metodo_top = "sin_dato"
        metodo_total = 0

    if not pedidos_por_estado.empty:
        estado_top = pedidos_por_estado.index[0]
        estado_total = pedidos_por_estado.iloc[0]
    else:
        estado_top = "Ninguno"
        estado_total = 0

    if not top_categorias.empty:
        categoria_top = top_categorias.index[0]
        categoria_total = top_categorias.iloc[0]
    else:
        categoria_top = "Ninguna"
        categoria_total = 0

    resumen = [
        "Resumen general del analisis:",
        f"- Registros analizados: {len(df)}",
        f"- Ingresos aprobados: ${ingresos_aprobados:,.2f}",
        f"- Productos con stock bajo detectados en dataset: {stock_bajo}",
        f"- Metodo de pago mas usado: {metodo_top} ({metodo_total})",
        f"- Estado de pedido dominante: {estado_top} ({estado_total})",
        f"- Categoria con mayor ingreso: {categoria_top} (${categoria_total:,.2f})"
    ]

    with open(resultados_path, "w", encoding="utf-8") as fh:
        fh.write("Analisis DRGUERIA - resultados_spark.txt\n")
        fh.write(f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        for linea in resumen:
            fh.write(linea + "\n")

    pagos_png = os.path.join(output_dir, "pagos_por_metodo.png")
    pedidos_png = os.path.join(output_dir, "pedidos_por_estado.png")
    categorias_png = os.path.join(output_dir, "top_categorias_ingresos.png")
    pdf_path = os.path.join(output_dir, "reporte_drgueria.pdf")

    draw_pie_like_chart(list(pagos_por_metodo.items()) or [("sin_dato", 1)], "Pagos por metodo", pagos_png)
    draw_bar_chart(list(pedidos_por_estado.items()) or [("sin_dato", 0)], "Pedidos por estado", pedidos_png, "#2ca02c")
    draw_bar_chart([(str(k), float(v)) for k, v in top_categorias.items()] or [("Ninguna", 0)], "Top categorias por ingresos", categorias_png, "#ff7f0e")

    generate_pdf(pdf_path, resumen, [pagos_png, pedidos_png, categorias_png])

    print(f"Analisis completado. Se generaron archivos en {output_dir}")


if __name__ == "__main__":
    main()
