#!/usr/bin/env python3
# ══════════════════════════════════════════════════════════════
# analisis_drgueria.py — Análisis con PySpark + Matplotlib/Seaborn
# Genera gráficas profesionales y reporte PDF
# ══════════════════════════════════════════════════════════════

import os
import sys
import warnings
from datetime import datetime

warnings.filterwarnings("ignore")

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import pandas as pd
from pandas.errors import EmptyDataError
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage,
    Table, TableStyle, HRFlowable
)

# ── Paleta de colores DRGUERIA ──────────────────────────────
VERDE_PRIMARIO  = "#1a6b4a"
VERDE_CLARO     = "#2d9e6f"
VERDE_MUY_CLARO = "#a8d5bf"
GRIS_OSCURO     = "#2c2c2c"
GRIS_MEDIO      = "#6b7280"
BLANCO          = "#ffffff"
FONDO           = "#f0f7f3"

PALETA = [
    "#1a6b4a", "#2d9e6f", "#57c49a", "#a8d5bf", "#d4ede5",
    "#0d4a33", "#3db882", "#85d4b0", "#c2ead8", "#f0f7f3"
]

plt.rcParams.update({
    "font.family":       "DejaVu Sans",
    "font.size":         11,
    "axes.titlesize":    14,
    "axes.titleweight":  "bold",
    "axes.titlecolor":   GRIS_OSCURO,
    "axes.labelcolor":   GRIS_MEDIO,
    "axes.spines.top":   False,
    "axes.spines.right": False,
    "axes.grid":         True,
    "grid.alpha":        0.35,
    "grid.linestyle":    "--",
    "figure.facecolor":  BLANCO,
    "axes.facecolor":    FONDO,
    "xtick.color":       GRIS_MEDIO,
    "ytick.color":       GRIS_MEDIO,
})


# ══════════════════════════════════════════════
# SPARK
# ══════════════════════════════════════════════
def crear_spark():
    try:
        from pyspark.sql import SparkSession
        spark = (
            SparkSession.builder
            .appName("DRGUERIA-Analytics")
            .master("local[*]")
            .config("spark.driver.memory", "512m")
            .config("spark.executor.memory", "512m")
            .config("spark.ui.enabled", "false")
            .config("spark.sql.shuffle.partitions", "4")
            .getOrCreate()
        )
        spark.sparkContext.setLogLevel("ERROR")
        return spark
    except Exception:
        return None


def analizar_con_spark(df_pandas, spark):
    """Ejecuta análisis distribuido con PySpark y devuelve métricas enriquecidas."""
    if spark is None or df_pandas.empty:
        return {}

    try:
        df = spark.createDataFrame(df_pandas.astype(str))
        from pyspark.sql import functions as F
        from pyspark.sql.types import DoubleType, IntegerType

        df = (df
              .withColumn("monto_pago",          F.col("monto_pago").cast(DoubleType()))
              .withColumn("stock_actual",         F.col("stock_actual").cast(IntegerType()))
              .withColumn("stock_minimo",         F.col("stock_minimo").cast(IntegerType()))
              .withColumn("cantidad_solicitada",  F.col("cantidad_solicitada").cast(IntegerType())))

        estados_ok = ["aprobado", "pagado", "registrado_auditoria"]
        df_aprobado = df.filter(F.col("estado_pago").isin(estados_ok))

        # Métricas globales
        metricas = df_aprobado.agg(
            F.sum("monto_pago").alias("ingresos_totales"),
            F.count("compra_id").alias("total_transacciones"),
            F.avg("monto_pago").alias("ticket_promedio"),
            F.max("monto_pago").alias("compra_maxima"),
        ).collect()[0]

        # Top categorías
        top_cat = (df_aprobado
                   .groupBy("categoria")
                   .agg(F.sum("monto_pago").alias("total"))
                   .orderBy(F.desc("total"))
                   .limit(6)
                   .collect())

        # Métodos de pago
        metodos = (df
                   .groupBy("metodo_pago")
                   .agg(F.count("*").alias("cantidad"))
                   .orderBy(F.desc("cantidad"))
                   .collect())

        # Estado pedidos
        estados = (df
                   .groupBy("estado_pedido")
                   .agg(F.count("*").alias("cantidad"))
                   .orderBy(F.desc("cantidad"))
                   .collect())

        # Usuarios más activos
        top_usuarios = (df_aprobado
                        .groupBy("usuario_nombre", "usuario_rol")
                        .agg(
                            F.count("compra_id").alias("compras"),
                            F.sum("monto_pago").alias("total_gastado")
                        )
                        .orderBy(F.desc("total_gastado"))
                        .limit(5)
                        .collect())

        # Stock bajo
        stock_bajo = (df
                      .filter(F.col("stock_actual") < F.col("stock_minimo"))
                      .select("producto_nombre", "stock_actual", "stock_minimo")
                      .distinct()
                      .limit(5)
                      .collect())

        return {
            "ingresos_totales":    float(metricas["ingresos_totales"] or 0),
            "total_transacciones": int(metricas["total_transacciones"] or 0),
            "ticket_promedio":     float(metricas["ticket_promedio"] or 0),
            "compra_maxima":       float(metricas["compra_maxima"] or 0),
            "top_categorias":      [(r["categoria"], float(r["total"])) for r in top_cat],
            "metodos_pago":        [(r["metodo_pago"], int(r["cantidad"])) for r in metodos],
            "estados_pedido":      [(r["estado_pedido"], int(r["cantidad"])) for r in estados],
            "top_usuarios":        [(r["usuario_nombre"] or "Anónimo", float(r["total_gastado"] or 0)) for r in top_usuarios],
            "stock_bajo":          [(r["producto_nombre"], int(r["stock_actual"] or 0)) for r in stock_bajo],
            "total_registros":     df.count(),
        }
    except Exception as e:
        print(f"[SPARK] Error en análisis: {e}", file=sys.stderr)
        return {}
    finally:
        try:
            spark.stop()
        except Exception:
            pass


# ══════════════════════════════════════════════
# GRÁFICAS
# ══════════════════════════════════════════════

def fig_save(fig, path):
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor=BLANCO)
    plt.close(fig)


def grafica_barras_categorias(datos, output_path):
    if not datos:
        datos = [("Sin datos", 0)]

    labels = [d[0][:18] for d in datos]
    values = [d[1] for d in datos]
    colors_bars = PALETA[:len(labels)]

    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.barh(labels, values, color=colors_bars, edgecolor="white", linewidth=0.8, height=0.6)

    for bar, val in zip(bars, values):
        ax.text(
            bar.get_width() + max(values) * 0.01,
            bar.get_y() + bar.get_height() / 2,
            f"${val:,.0f}",
            va="center", ha="left", fontsize=10, color=GRIS_OSCURO, fontweight="bold"
        )

    ax.set_title("💊 Ingresos por Categoría de Producto", pad=15)
    ax.set_xlabel("Ingresos (COP)", labelpad=8)
    ax.invert_yaxis()
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
    fig.tight_layout()
    fig_save(fig, output_path)


def grafica_dona_pagos(datos, output_path):
    if not datos:
        datos = [("Sin datos", 1)]

    labels = [d[0] for d in datos]
    values = [d[1] for d in datos]
    colors_pie = PALETA[:len(labels)]

    fig, ax = plt.subplots(figsize=(8, 6))
    wedges, texts, autotexts = ax.pie(
        values,
        labels=None,
        colors=colors_pie,
        autopct="%1.1f%%",
        startangle=140,
        wedgeprops={"width": 0.55, "edgecolor": BLANCO, "linewidth": 2},
        pctdistance=0.75
    )

    for at in autotexts:
        at.set_color(BLANCO)
        at.set_fontsize(10)
        at.set_fontweight("bold")

    total = sum(values)
    ax.text(0, 0, f"{total}\ntransacc.", ha="center", va="center",
            fontsize=12, fontweight="bold", color=GRIS_OSCURO)

    legend_labels = [f"{l} ({v})" for l, v in zip(labels, values)]
    ax.legend(wedges, legend_labels, loc="lower center", bbox_to_anchor=(0.5, -0.15),
              ncol=2, frameon=False, fontsize=9)

    ax.set_title("💳 Distribución de Métodos de Pago", pad=15)
    fig.tight_layout()
    fig_save(fig, output_path)


def grafica_estados_pedidos(datos, output_path):
    if not datos:
        datos = [("Sin datos", 0)]

    labels = [d[0][:20] for d in datos]
    values = [d[1] for d in datos]
    colors_bars = [VERDE_PRIMARIO, VERDE_CLARO, "#57c49a", "#85d4b0", "#a8d5bf"][:len(labels)]

    fig, ax = plt.subplots(figsize=(9, 5))
    bars = ax.bar(labels, values, color=colors_bars, edgecolor=BLANCO, linewidth=0.8, width=0.55)

    for bar, val in zip(bars, values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + max(values) * 0.02,
            str(val),
            ha="center", va="bottom", fontsize=11, fontweight="bold", color=GRIS_OSCURO
        )

    ax.set_title("📦 Pedidos por Estado", pad=15)
    ax.set_ylabel("Cantidad", labelpad=8)
    ax.set_ylim(0, max(values) * 1.2 if values else 1)
    fig.tight_layout()
    fig_save(fig, output_path)


def grafica_top_usuarios(datos, output_path):
    if not datos:
        datos = [("Sin datos", 0)]

    labels = [d[0][:16] for d in datos]
    values = [d[1] for d in datos]

    fig, ax = plt.subplots(figsize=(10, 5))
    colors_bars = PALETA[:len(labels)]
    bars = ax.barh(labels, values, color=colors_bars, edgecolor=BLANCO, linewidth=0.8, height=0.55)

    for bar, val in zip(bars, values):
        ax.text(
            bar.get_width() + max(values) * 0.01,
            bar.get_y() + bar.get_height() / 2,
            f"${val:,.0f}",
            va="center", ha="left", fontsize=10, color=GRIS_OSCURO, fontweight="bold"
        )

    ax.set_title("🏆 Top Clientes por Volumen de Compras", pad=15)
    ax.set_xlabel("Total Gastado (COP)", labelpad=8)
    ax.invert_yaxis()
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
    fig.tight_layout()
    fig_save(fig, output_path)


def grafica_dashboard_kpis(metricas, output_path):
    """Panel de KPIs — tarjetas visuales."""
    fig = plt.figure(figsize=(12, 3.5))
    fig.patch.set_facecolor(BLANCO)

    kpis = [
        ("💰 Ingresos Totales",   f"${metricas.get('ingresos_totales', 0):,.0f}",   VERDE_PRIMARIO),
        ("🛒 Transacciones",       str(metricas.get('total_transacciones', 0)),       VERDE_CLARO),
        ("📊 Ticket Promedio",     f"${metricas.get('ticket_promedio', 0):,.0f}",    "#0d4a33"),
        ("📦 Registros Spark",     str(metricas.get('total_registros', 0)),           "#3db882"),
    ]

    for i, (titulo, valor, color) in enumerate(kpis):
        ax = fig.add_subplot(1, 4, i + 1)
        ax.set_facecolor(color)
        ax.set_xticks([])
        ax.set_yticks([])
        for spine in ax.spines.values():
            spine.set_visible(False)

        ax.text(0.5, 0.62, valor, transform=ax.transAxes,
                ha="center", va="center", fontsize=22, fontweight="bold", color=BLANCO)
        ax.text(0.5, 0.22, titulo, transform=ax.transAxes,
                ha="center", va="center", fontsize=10, color=BLANCO, alpha=0.9)

    fig.suptitle("DRGUERIA — Panel de Indicadores Clave", fontsize=14,
                 fontweight="bold", color=GRIS_OSCURO, y=1.02)
    fig.tight_layout(w_pad=0.5)
    fig_save(fig, output_path)


# ══════════════════════════════════════════════
# PDF PROFESIONAL
# ══════════════════════════════════════════════

def generar_pdf(pdf_path, resumen_lines, metricas, png_files):
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=2 * cm,   bottomMargin=2 * cm
    )

    styles = getSampleStyleSheet()
    story  = []

    title_style = ParagraphStyle(
        "DRGTitle",
        parent=styles["Title"],
        fontSize=22, textColor=colors.HexColor(VERDE_PRIMARIO),
        spaceAfter=4
    )
    sub_style = ParagraphStyle(
        "DRGSub",
        parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor(GRIS_MEDIO),
        spaceAfter=12
    )
    section_style = ParagraphStyle(
        "DRGSection",
        parent=styles["Heading2"],
        fontSize=13, textColor=colors.HexColor(VERDE_PRIMARIO),
        spaceBefore=16, spaceAfter=6
    )
    body_style = ParagraphStyle(
        "DRGBody",
        parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor(GRIS_OSCURO),
        spaceAfter=4, leading=16
    )

    # ── Encabezado ─────────────────────────────────────────
    story.append(Paragraph("🏥 DRGUERIA", title_style))
    story.append(Paragraph("Sistema de Gestión Farmacéutica — Reporte Analítico", sub_style))
    story.append(Paragraph(f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')} | Motor: Apache Spark 3.5", sub_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor(VERDE_PRIMARIO), spaceAfter=12))

    # ── KPIs tabla ─────────────────────────────────────────
    story.append(Paragraph("Indicadores Clave de Negocio", section_style))

    kpi_data = [
        ["Indicador", "Valor"],
        ["💰 Ingresos Totales (aprobados)",  f"${metricas.get('ingresos_totales', 0):,.2f}"],
        ["🛒 Total Transacciones",            str(metricas.get('total_transacciones', 0))],
        ["📊 Ticket Promedio",                f"${metricas.get('ticket_promedio', 0):,.2f}"],
        ["🏆 Compra Más Alta",                f"${metricas.get('compra_maxima', 0):,.2f}"],
        ["📦 Registros Procesados (Spark)",   str(metricas.get('total_registros', 0))],
    ]

    t = Table(kpi_data, colWidths=[10 * cm, 6 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  colors.HexColor(VERDE_PRIMARIO)),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0),  11),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor(FONDO), colors.white]),
        ("FONTNAME",     (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",     (0, 1), (-1, -1), 10),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#d4ede5")),
        ("TOPPADDING",   (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 7),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.4 * cm))

    # ── Resumen Spark ──────────────────────────────────────
    story.append(Paragraph("Resultados del Análisis Spark", section_style))
    for line in resumen_lines:
        if line.strip():
            story.append(Paragraph(line, body_style))

    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor(VERDE_MUY_CLARO), spaceAfter=12))

    # ── Gráficas ───────────────────────────────────────────
    story.append(Paragraph("Visualizaciones Analíticas", section_style))

    grafica_nombres = {
        "kpi_dashboard.png":          "Panel de KPIs",
        "categorias_ingresos.png":    "Ingresos por Categoría",
        "pagos_por_metodo.png":       "Métodos de Pago",
        "pedidos_por_estado.png":     "Estado de Pedidos",
        "top_clientes.png":           "Top Clientes",
    }

    for png in png_files:
        nombre = os.path.basename(png)
        titulo = grafica_nombres.get(nombre, nombre)
        story.append(Paragraph(titulo, ParagraphStyle(
            "GraphTitle", parent=styles["Normal"],
            fontSize=11, textColor=colors.HexColor(GRIS_OSCURO),
            fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=6
        )))
        story.append(RLImage(png, width=16 * cm, height=8 * cm))
        story.append(Spacer(1, 0.3 * cm))

    # ── Pie de página ──────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor(VERDE_MUY_CLARO), spaceBefore=12))
    story.append(Paragraph(
        f"DRGUERIA — Reporte generado automáticamente con Apache Spark 3.5 | {datetime.now().year}",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8,
                       textColor=colors.HexColor(GRIS_MEDIO), alignment=1)
    ))

    doc.build(story)


# ══════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════

def main():
    if len(sys.argv) < 4:
        raise SystemExit("Uso: python analisis_drgueria.py <dataset.csv> <output_dir> <resultados.txt>")

    dataset_path  = sys.argv[1]
    output_dir    = sys.argv[2]
    resultados_path = sys.argv[3]

    os.makedirs(output_dir, exist_ok=True)

    # ── Cargar dataset ─────────────────────────────────────
    try:
        df = pd.read_csv(dataset_path)
    except (EmptyDataError, FileNotFoundError):
        df = pd.DataFrame()

    # ── Análisis con Spark ─────────────────────────────────
    print("[SPARK] Iniciando sesión Spark...", flush=True)
    spark   = crear_spark()
    metricas = analizar_con_spark(df, spark) if not df.empty else {}
    print(f"[SPARK] Métricas obtenidas: {list(metricas.keys())}", flush=True)

    # ── Fallback con pandas si Spark falla ─────────────────
    if not metricas and not df.empty:
        estados_ok = ["aprobado", "pagado", "registrado_auditoria"]
        df_ok = df[df["estado_pago"].isin(estados_ok)] if "estado_pago" in df.columns else df
        metricas = {
            "ingresos_totales":    df_ok["monto_pago"].sum() if "monto_pago" in df_ok else 0,
            "total_transacciones": len(df_ok),
            "ticket_promedio":     df_ok["monto_pago"].mean() if "monto_pago" in df_ok else 0,
            "compra_maxima":       df_ok["monto_pago"].max() if "monto_pago" in df_ok else 0,
            "top_categorias":      list(df.groupby("categoria")["monto_pago"].sum().sort_values(ascending=False).head(6).items()) if "categoria" in df.columns else [],
            "metodos_pago":        list(df["metodo_pago"].value_counts().head(5).items()) if "metodo_pago" in df.columns else [],
            "estados_pedido":      list(df["estado_pedido"].value_counts().head(5).items()) if "estado_pedido" in df.columns else [],
            "top_usuarios":        list(df_ok.groupby("usuario_nombre")["monto_pago"].sum().sort_values(ascending=False).head(5).items()) if "usuario_nombre" in df_ok else [],
            "stock_bajo":          [],
            "total_registros":     len(df),
        }

    # ── Resumen texto ─────────────────────────────────────
    top_cat    = metricas.get("top_categorias", [])
    top_metodo = metricas.get("metodos_pago", [("sin_dato", 0)])[0]
    top_estado = metricas.get("estados_pedido", [("sin_dato", 0)])[0]
    top_cat_0  = top_cat[0] if top_cat else ("sin_dato", 0)

    resumen_lines = [
        "Resumen general del analisis:",
        f"- Registros analizados: {metricas.get('total_registros', 0)}",
        f"- Ingresos aprobados: ${metricas.get('ingresos_totales', 0):,.2f}",
        f"- Ticket promedio: ${metricas.get('ticket_promedio', 0):,.2f}",
        f"- Compra mas alta: ${metricas.get('compra_maxima', 0):,.2f}",
        f"- Metodo de pago mas usado: {top_metodo[0]} ({top_metodo[1]})",
        f"- Estado de pedido dominante: {top_estado[0]} ({top_estado[1]})",
        f"- Categoria con mayor ingreso: {top_cat_0[0]} (${top_cat_0[1]:,.2f})",
        f"- Motor de analisis: Apache Spark 3.5",
    ]

    with open(resultados_path, "w", encoding="utf-8") as fh:
        fh.write("Analisis DRGUERIA - resultados_spark.txt\n")
        fh.write(f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        for line in resumen_lines:
            fh.write(line + "\n")

    # ── Generar gráficas ──────────────────────────────────
    print("[GRAFICAS] Generando visualizaciones...", flush=True)

    paths = {
        "kpi":         os.path.join(output_dir, "kpi_dashboard.png"),
        "categorias":  os.path.join(output_dir, "categorias_ingresos.png"),
        "pagos":       os.path.join(output_dir, "pagos_por_metodo.png"),
        "estados":     os.path.join(output_dir, "pedidos_por_estado.png"),
        "usuarios":    os.path.join(output_dir, "top_clientes.png"),
    }

    grafica_dashboard_kpis(metricas, paths["kpi"])
    grafica_barras_categorias(metricas.get("top_categorias", []), paths["categorias"])
    grafica_dona_pagos(metricas.get("metodos_pago", []), paths["pagos"])
    grafica_estados_pedidos(metricas.get("estados_pedido", []), paths["estados"])
    grafica_top_usuarios(metricas.get("top_usuarios", []), paths["usuarios"])

    png_files = [p for p in paths.values() if os.path.exists(p)]

    # ── Generar PDF ───────────────────────────────────────
    pdf_path = os.path.join(output_dir, "reporte_drgueria.pdf")
    print("[PDF] Generando reporte PDF profesional...", flush=True)
    generar_pdf(pdf_path, resumen_lines, metricas, png_files)

    print(f"[OK] Análisis completado. {len(png_files)} gráficas + PDF en {output_dir}", flush=True)


if __name__ == "__main__":
    main()
