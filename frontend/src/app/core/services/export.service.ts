import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Workbook, type Borders } from 'exceljs';

export interface ColumnaExportacion<T> {
    encabezado: string;
    valor: (item: T) => string | number;
    ancho?: number;
}

export interface OpcionesExportacion<T> {
    titulo: string;
    subtitulo: string;
    nombreArchivo: string;
    columnas: ColumnaExportacion<T>[];
    datos: T[];
}

const COLOR_MARCA: [number, number, number] = [29, 78, 216];
const COLOR_TEXTO: [number, number, number] = [15, 23, 42];
const COLOR_TEXTO_SUAVE: [number, number, number] = [100, 116, 139];
const COLOR_LINEA: [number, number, number] = [226, 232, 240];

const COLOR_MARCA_ARGB = 'FF1D4ED8';

const BORDE_CELDA: Partial<Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

@Injectable({
    providedIn: 'root',
})
export class ExportService {
    private logoBase64Promise: Promise<string> | null = null;

    async exportarExcel<T>(opciones: OpcionesExportacion<T>): Promise<void> {
        const { titulo, subtitulo, nombreArchivo, columnas, datos } =
            opciones;

        const libro = new Workbook();
        libro.creator = 'Sistema de Carga Aérea';
        libro.created = new Date();

        const hoja = libro.addWorksheet(titulo.substring(0, 31));

        hoja.columns = columnas.map(() => ({ width: 24 }));

        const ultimaColumna = Math.max(columnas.length, 2);

        try {
            const logo = await this.cargarLogo();

            const imagenId = libro.addImage({
                base64: logo,
                extension: 'png',
            });

            hoja.addImage(imagenId, {
                tl: { col: 0.15, row: 0.15 },
                ext: { width: 130, height: 39 },
            });
        } catch {
        }

        const celdaTitulo = hoja.getCell(1, 2);
        hoja.mergeCells(1, 2, 1, ultimaColumna);
        celdaTitulo.value = 'SISTEMA DE CARGA AÉREA';
        celdaTitulo.font = {
            bold: true,
            size: 14,
            color: { argb: 'FF0F172A' },
        };
        celdaTitulo.alignment = { vertical: 'middle' };

        const celdaSubtitulo = hoja.getCell(2, 2);
        hoja.mergeCells(2, 2, 2, ultimaColumna);
        celdaSubtitulo.value = subtitulo;
        celdaSubtitulo.font = {
            italic: true,
            size: 11,
            color: { argb: 'FF64748B' },
        };

        const celdaFecha = hoja.getCell(3, 2);
        hoja.mergeCells(3, 2, 3, ultimaColumna);
        celdaFecha.value = `Generado: ${new Date().toLocaleString('es-PE')}`;
        celdaFecha.font = { size: 9, color: { argb: 'FF94A3B8' } };

        hoja.getRow(1).height = 22;
        hoja.getRow(2).height = 18;
        hoja.getRow(3).height = 16;

        const filaEncabezado = hoja.getRow(5);

        columnas.forEach((columna, indice) => {
            const celda = filaEncabezado.getCell(indice + 1);
            celda.value = columna.encabezado;
            celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            celda.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: COLOR_MARCA_ARGB },
            };
            celda.alignment = { vertical: 'middle' };
            celda.border = BORDE_CELDA;
        });

        filaEncabezado.height = 20;
        filaEncabezado.commit();

        datos.forEach((item, indiceFila) => {
            const fila = hoja.getRow(6 + indiceFila);

            columnas.forEach((columna, indiceColumna) => {
                const celda = fila.getCell(indiceColumna + 1);
                celda.value = columna.valor(item);
                celda.border = BORDE_CELDA;

                if (indiceFila % 2 === 1) {
                    celda.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF8FAFC' },
                    };
                }
            });

            fila.commit();
        });

        const buffer = await libro.xlsx.writeBuffer();

        this.descargarArchivo(
            buffer as unknown as ArrayBuffer,
            `${nombreArchivo}.xlsx`,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
    }

    async exportarPdf<T>(opciones: OpcionesExportacion<T>): Promise<void> {
        const { titulo, subtitulo, nombreArchivo, columnas, datos } =
            opciones;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        const anchoPagina = doc.internal.pageSize.getWidth();
        const altoPagina = doc.internal.pageSize.getHeight();

        try {
            const logo = await this.cargarLogo();
            doc.addImage(logo, 'PNG', 14, 10, 34, 10.3);
        } catch {
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...COLOR_TEXTO);
        doc.text('Sistema de Carga Aérea', anchoPagina - 14, 15, {
            align: 'right',
        });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...COLOR_TEXTO_SUAVE);
        doc.text(subtitulo, anchoPagina - 14, 20.5, { align: 'right' });

        doc.text(
            `Generado: ${new Date().toLocaleString('es-PE')}`,
            anchoPagina - 14,
            25.5,
            { align: 'right' },
        );

        doc.setDrawColor(...COLOR_LINEA);
        doc.line(14, 28, anchoPagina - 14, 28);

        const columnStyles: Record<number, { cellWidth: number }> = {};

        columnas.forEach((columna, indice) => {
            if (columna.ancho) {
                columnStyles[indice] = { cellWidth: columna.ancho };
            }
        });

        autoTable(doc, {
            startY: 33,
            margin: { left: 14, right: 14 },
            head: [columnas.map((columna) => columna.encabezado)],
            body: datos.map((item) =>
                columnas.map((columna) => columna.valor(item)),
            ),
            theme: 'striped',
            headStyles: {
                fillColor: COLOR_MARCA,
                textColor: 255,
                fontStyle: 'bold',
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
                overflow: 'ellipsize',
            },
            columnStyles,
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
        });

        const totalPaginas = doc.getNumberOfPages();

        for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
            doc.setPage(pagina);
            doc.setFontSize(8);
            doc.setTextColor(...COLOR_TEXTO_SUAVE);

            doc.text(
                `Página ${pagina} de ${totalPaginas}`,
                anchoPagina - 14,
                altoPagina - 8,
                { align: 'right' },
            );

            doc.text(titulo, 14, altoPagina - 8);
        }

        doc.save(`${nombreArchivo}.pdf`);
    }

    private descargarArchivo(
        datos: ArrayBuffer,
        nombre: string,
        tipo: string,
    ): void {
        const blob = new Blob([datos], { type: tipo });
        const url = URL.createObjectURL(blob);

        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        enlace.click();

        URL.revokeObjectURL(url);
    }

    private cargarLogo(): Promise<string> {
        if (!this.logoBase64Promise) {
            this.logoBase64Promise = fetch('/images/logo.png')
                .then((respuesta) => respuesta.blob())
                .then(
                    (blob) =>
                        new Promise<string>((resolve, reject) => {
                            const lector = new FileReader();
                            lector.onload = () =>
                                resolve(lector.result as string);
                            lector.onerror = reject;
                            lector.readAsDataURL(blob);
                        }),
                );
        }

        return this.logoBase64Promise;
    }
}
