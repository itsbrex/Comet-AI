/**
 * Advanced Document Generation Engine
 * Supports PDF, XLSX, PPTX with images, watermarks, tables, charts, and Mermaid diagrams
 */

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import PDFTable from 'pdf-lib-table';
import fontkit from '@pdf-lib/fontkit';
import XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';
import type { WorkBook, WorkSheet } from 'xlsx/types';

export interface DocumentOptions {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    watermark?: WatermarkOptions;
    header?: HeaderFooterOptions;
    footer?: HeaderFooterOptions;
    pageNumbers?: boolean;
    backgroundColor?: string;
    margin?: { top?: number; bottom?: number; left?: number; right?: number };
}

export interface WatermarkOptions {
    text?: string;
    imageUrl?: string;
    opacity?: number;
    angle?: number;
    fontSize?: number;
    color?: string;
    position?: 'center' | 'tile' | 'all-corners';
}

export interface HeaderFooterOptions {
    text?: string;
    imageUrl?: string;
    alignment?: 'left' | 'center' | 'right';
    fontSize?: number;
    color?: string;
}

export interface TableData {
    headers: string[];
    rows: (string | number)[][];
    title?: string;
    columnWidths?: number[];
    style?: TableStyle;
}

export interface TableStyle {
    headerBackground?: string;
    headerTextColor?: string;
    cellPadding?: number;
    fontSize?: number;
    borderColor?: string;
    borderWidth?: number;
    alternateRowColors?: boolean;
    alternateColor?: string;
}

export interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'scatter';
    title: string;
    labels: string[];
    datasets: {
        name: string;
        values: number[];
        color?: string;
    }[];
    showLegend?: boolean;
    showDataLabels?: boolean;
}

export interface ImageOptions {
    url?: string;
    base64?: string;
    localPath?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    keepAspectRatio?: boolean;
    opacity?: number;
}

export interface PageOptions {
    size?: 'A4' | 'LETTER' | 'LEGAL' | 'A3' | 'A5';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
}

const DEFAULT_COLORS = {
    primary: '#4F46E5',
    secondary: '#7C3AED',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#0EA5E9',
    dark: '#1F2937',
    light: '#F3F4F6',
};

const PAGE_SIZES = {
    A4: [595.28, 841.89],
    LETTER: [612, 792],
    LEGAL: [612, 1008],
    A3: [841.89, 1190.55],
    A5: [419.53, 595.28],
};

export class AdvancedPDFEngine {
    private pdfDoc: PDFDocument | null = null;
    private currentPage: any = null;
    private font: any = null;
    private boldFont: any = null;
    private customFonts: Map<string, any> = new Map();

    async initialize(options: PageOptions = {}): Promise<void> {
        this.pdfDoc = await PDFDocument.create();
        this.pdfDoc.registerFontkit(fontkit);

        const size = PAGE_SIZES[options.size || 'A4'];
        const isLandscape = options.orientation === 'landscape';
        
        this.currentPage = this.pdfDoc.addPage([
            isLandscape ? size[1] : size[0],
            isLandscape ? size[0] : size[1]
        ]);

        this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
        this.boldFont = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    async loadFromExisting(base64OrUrl: string): Promise<void> {
        const bytes = await this.fetchImageBytes(base64OrUrl);
        this.pdfDoc = await PDFDocument.load(bytes);
        this.pdfDoc.registerFontkit(fontkit);
        this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
        this.boldFont = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    private async fetchImageBytes(url: string): Promise<Uint8Array> {
        if (url.startsWith('data:')) {
            const base64 = url.split(',')[1];
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }
        
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }

    async addImage(options: ImageOptions): Promise<void> {
        if (!this.pdfDoc || !this.currentPage) return;

        let imageBytes: Uint8Array;
        let imageType: 'jpg' | 'png';

        if (options.url) {
            imageBytes = await this.fetchImageBytes(options.url);
            imageType = options.url.toLowerCase().includes('.png') ? 'png' : 'jpg';
        } else if (options.base64) {
            imageBytes = await this.fetchImageBytes(`data:image/${options.base64.includes('iVBOR') ? 'png' : 'jpg'};base64,${options.base64}`);
            imageType = options.base64.includes('iVBOR') ? 'png' : 'jpg';
        } else {
            return;
        }

        let image;
        if (imageType === 'png') {
            image = await this.pdfDoc.embedPng(imageBytes);
        } else {
            image = await this.pdfDoc.embedJpg(imageBytes);
        }

        const pageWidth = this.currentPage.getWidth();
        const pageHeight = this.currentPage.getHeight();

        let width = options.width || 200;
        let height = options.height || 150;

        if (options.keepAspectRatio) {
            const aspectRatio = image.width / image.height;
            if (width && !height) {
                height = width / aspectRatio;
            } else if (height && !width) {
                width = height * aspectRatio;
            }
        }

        const x = options.x ?? (pageWidth - width) / 2;
        const y = options.y ?? (pageHeight - height) / 2;

        this.currentPage.drawImage(image, {
            x,
            y,
            width,
            height,
            opacity: options.opacity ?? 1,
        });
    }

    async addWatermark(options: WatermarkOptions): Promise<void> {
        if (!this.pdfDoc || !this.currentPage) return;

        const pages = this.pdfDoc.getPages();
        const opacity = options.opacity ?? 0.15;
        const angle = options.angle ?? 45;
        const fontSize = options.fontSize ?? 60;

        if (options.text) {
            const color = this.hexToRgb(options.color || '#cccccc');
            
            for (const page of pages) {
                const { width, height } = page.getSize();
                
                if (options.position === 'tile') {
                    const spacing = 150;
                    for (let x = 0; x < width; x += spacing) {
                        for (let y = 0; y < height; y += spacing) {
                            page.drawText(options.text, {
                                x,
                                y,
                                size: fontSize,
                                font: this.font,
                                color: rgb(color.r, color.g, color.b),
                                opacity,
                                rotate: degrees(angle),
                            });
                        }
                    }
                } else if (options.position === 'all-corners') {
                    const cornerPositions = [
                        { x: 50, y: height - 80 },
                        { x: width - 200, y: height - 80 },
                        { x: 50, y: 50 },
                        { x: width - 200, y: 50 },
                    ];
                    
                    for (const pos of cornerPositions) {
                        page.drawText(options.text, {
                            x: pos.x,
                            y: pos.y,
                            size: fontSize * 0.4,
                            font: this.font,
                            color: rgb(color.r, color.g, color.b),
                            opacity: opacity * 0.6,
                        });
                    }
                } else {
                    page.drawText(options.text, {
                        x: width / 2 - 100,
                        y: height / 2,
                        size: fontSize,
                        font: this.font,
                        color: rgb(color.r, color.g, color.b),
                        opacity,
                        rotate: degrees(angle),
                    });
                }
            }
        }

        if (options.imageUrl) {
            const imageBytes = await this.fetchImageBytes(options.imageUrl);
            let image;
            const isPng = options.imageUrl.toLowerCase().includes('.png');
            
            if (isPng) {
                image = await this.pdfDoc.embedPng(imageBytes);
            } else {
                image = await this.pdfDoc.embedJpg(imageBytes);
            }

            const scale = 0.15;
            const imgWidth = image.width * scale;
            const imgHeight = image.height * scale;

            for (const page of pages) {
                const { width, height } = page.getSize();
                
                page.drawImage(image, {
                    x: width - imgWidth - 20,
                    y: height - imgHeight - 20,
                    width: imgWidth,
                    height: imgHeight,
                    opacity: opacity * 0.5,
                });
            }
        }
    }

    async addTable(tableData: TableData): Promise<void> {
        if (!this.pdfDoc || !this.currentPage || !tableData.rows.length) return;

        const { width, height } = this.currentPage.getSize();
        const margin = 50;
        const tableWidth = width - margin * 2;
        
        const style = tableData.style || {};
        const headerBg = this.hexToRgb(style.headerBackground || DEFAULT_COLORS.primary);
        const cellBg = this.hexToRgb(DEFAULT_COLORS.light);
        const altBg = this.hexToRgb(style.alternateColor || '#f9fafb');
        const borderColor = this.hexToRgb(style.borderColor || '#e5e7eb');
        const fontSize = style.fontSize || 10;
        const cellPadding = style.cellPadding || 5;

        const colCount = tableData.headers.length;
        const colWidth = tableWidth / colCount;
        const rowHeight = fontSize * 2;

        let currentY = height - margin - rowHeight;

        this.currentPage.drawRectangle({
            x: margin,
            y: currentY - rowHeight,
            width: tableWidth,
            height: rowHeight,
            color: rgb(headerBg.r, headerBg.g, headerBg.b),
        });

        for (let i = 0; i < colCount; i++) {
            this.currentPage.drawText(String(tableData.headers[i] || ''), {
                x: margin + colWidth * i + cellPadding,
                y: currentY - rowHeight + cellPadding,
                size: fontSize,
                font: this.boldFont,
                color: rgb(1, 1, 1),
            });
        }

        currentY -= rowHeight;

        for (let rowIdx = 0; rowIdx < tableData.rows.length; rowIdx++) {
            const row = tableData.rows[rowIdx];
            
            if (style.alternateRowColors && rowIdx % 2 === 1) {
                this.currentPage.drawRectangle({
                    x: margin,
                    y: currentY - rowHeight,
                    width: tableWidth,
                    height: rowHeight,
                    color: rgb(altBg.r, altBg.g, altBg.b),
                });
            }

            for (let colIdx = 0; colIdx < colCount; colIdx++) {
                const cellValue = String(row[colIdx] ?? '');
                
                this.currentPage.drawText(cellValue, {
                    x: margin + colWidth * colIdx + cellPadding,
                    y: currentY - rowHeight + cellPadding,
                    size: fontSize,
                    font: this.font,
                    color: rgb(0, 0, 0),
                });
            }

            this.currentPage.drawRectangle({
                x: margin,
                y: currentY - rowHeight,
                width: tableWidth,
                height: 0.5,
                color: rgb(borderColor.r, borderColor.g, borderColor.b),
            });

            currentY -= rowHeight;
        }
    }

    async addChart(chartData: ChartData): Promise<void> {
        if (!this.currentPage) return;

        const { width, height } = this.currentPage.getSize();
        const chartWidth = width * 0.7;
        const chartHeight = 200;
        const chartX = (width - chartWidth) / 2;
        const chartY = height - 100;

        this.currentPage.drawRectangle({
            x: chartX,
            y: chartY - chartHeight,
            width: chartWidth,
            height: chartHeight,
            color: rgb(1, 1, 1),
            borderColor: rgb(0.8, 0.8, 0.8),
        });

        const maxValue = Math.max(...chartData.datasets.flatMap(d => d.values));
        const barWidth = chartWidth / (chartData.labels.length * chartData.datasets.length + 1);

        for (let dsIdx = 0; dsIdx < chartData.datasets.length; dsIdx++) {
            const dataset = chartData.datasets[dsIdx];
            const color = dataset.color ? this.hexToRgb(dataset.color) : { r: 0.3, g: 0.3, b: 0.8 };
            
            for (let i = 0; i < dataset.values.length; i++) {
                const value = dataset.values[i];
                const barHeight = (value / maxValue) * (chartHeight - 30);
                const x = chartX + 20 + (dsIdx * dataset.values.length + i) * barWidth;
                
                this.currentPage.drawRectangle({
                    x,
                    y: chartY - barHeight,
                    width: barWidth - 2,
                    height: barHeight,
                    color: rgb(color.r, color.g, color.b),
                });
            }
        }

        if (chartData.showDataLabels) {
            for (let i = 0; i < chartData.labels.length; i++) {
                this.currentPage.drawText(chartData.labels[i], {
                    x: chartX + 20 + i * barWidth * chartData.datasets.length,
                    y: chartY + 5,
                    size: 8,
                    font: this.font,
                    color: rgb(0.3, 0.3, 0.3),
                });
            }
        }
    }

    async addText(text: string, options: {
        x?: number;
        y?: number;
        size?: number;
        color?: string;
        font?: 'helvetica' | 'helveticaBold' | 'timesRoman' | 'courier';
        align?: 'left' | 'center' | 'right';
        maxWidth?: number;
    } = {}): Promise<void> {
        if (!this.currentPage) return;

        const color = options.color ? this.hexToRgb(options.color) : { r: 0, g: 0, b: 0 };
        const font = options.font === 'helveticaBold' ? this.boldFont : this.font;
        
        const { width } = this.currentPage.getSize();
        const x = options.x ?? 50;
        const maxWidth = options.maxWidth ?? width - x - 50;

        this.currentPage.drawText(text, {
            x,
            y: options.y ?? 700,
            size: options.size || 12,
            font,
            color: rgb(color.r, color.g, color.b),
            maxWidth,
        });
    }

    async addPageBreak(): Promise<void> {
        if (!this.pdfDoc) return;
        
        const pages = this.pdfDoc.getPages();
        const lastPage = pages[pages.length - 1];
        const size = lastPage.getSize() as { width?: number; height?: number };
        
        const pageWidth = size.width || 612;
        const pageHeight = size.height || 792;
        
        this.currentPage = this.pdfDoc.addPage([pageWidth, pageHeight]);
    }

    setDocumentMetadata(options: DocumentOptions): void {
        if (!this.pdfDoc) return;

        if (options.title) this.pdfDoc.setTitle(options.title);
        if (options.author) this.pdfDoc.setAuthor(options.author);
        if (options.subject) this.pdfDoc.setSubject(options.subject);
        if (options.keywords) this.pdfDoc.setKeywords(options.keywords.split(','));
        if (options.creator) this.pdfDoc.setCreator(options.creator);
    }

    async generate(): Promise<Uint8Array> {
        if (!this.pdfDoc) throw new Error('PDF not initialized');
        return await this.pdfDoc.save();
    }

    async generateBase64(): Promise<string> {
        const bytes = await this.generate();
        return Buffer.from(bytes).toString('base64');
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return { r: 0.3, g: 0.3, b: 0.3 };
        return {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
        };
    }
}

export class ExcelGenerator {
    private workbook: any = null;
    private worksheet: any = null;
    private fileName: string = 'spreadsheet';
    private sheetName: string = 'Sheet1';

    initialize(sheetName?: string): void {
        this.workbook = XLSX.utils.book_new();
        this.sheetName = sheetName || 'Sheet1';
        this.worksheet = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(this.workbook, this.worksheet, this.sheetName);
    }

    setData(data: (string | number)[][]): void {
        this.worksheet = XLSX.utils.aoa_to_sheet(data);
        this.workbook.Sheets[this.sheetName] = this.worksheet;
    }

    setColumnWidths(widths: number[]): void {
        const colWidths: Record<string, { wch: number }> = {};
        for (let i = 0; i < widths.length; i++) {
            const col = XLSX.utils.encode_col(i);
            colWidths[col] = { wch: widths[i] };
        }
        this.worksheet['!cols'] = Object.values(colWidths);
    }

    async addTable(tableData: TableData): Promise<void> {
        const startRow = 1;
        const headers = tableData.headers;
        const rows = tableData.rows;

        const allData = [headers, ...rows];
        this.setData(allData as (string | number)[][]);
    }

    async addChart(chartData: ChartData): Promise<void> {
        const labels = chartData.labels;
        const chartSheetName = `${this.sheetName}_Chart`;
        
        const dataArray: (string | number)[][] = [
            ['', ...labels],
            ...chartData.datasets.map(ds => [ds.name, ...ds.values])
        ];

        const chartSheet = XLSX.utils.aoa_to_sheet(dataArray);
        XLSX.utils.book_append_sheet(this.workbook, chartSheet, chartSheetName);
    }

    setHeaderRow(headers: string[]): void {
        const currentData = XLSX.utils.sheet_to_json(this.worksheet, { header: 1 }) as any[];
        const newData = [headers, ...currentData];
        this.setData(newData as (string | number)[][]);
    }

    setAutoFilter(): void {
        const range = XLSX.utils.decode_range(this.worksheet['!ref'] || 'A1');
        this.worksheet['!autofilter'] = {
            ref: XLSX.utils.encode_range(range),
        };
    }

    setFrozenRows(rows: number = 1): void {
        this.worksheet['!views'] = [
            {
                frozenRows: rows,
            }
        ];
    }

    generate(): Uint8Array {
        const buffer = XLSX.write(this.workbook, {
            bookType: 'xlsx',
            type: 'array',
        });
        return new Uint8Array(buffer);
    }

    generateBase64(): string {
        const buffer = this.generate();
        return Buffer.from(buffer).toString('base64');
    }

    async save(path: string): Promise<void> {
        const buffer = this.generate();
        const fs = require('fs');
        fs.writeFileSync(path, buffer);
    }
}

export class PowerPointGenerator {
    private presentation: any = null;
    private currentSlide: any = null;

    initialize(): void {
        this.presentation = new pptxgen();
    }

    async addSlide(): Promise<void> {
        this.currentSlide = this.presentation.addSlide();
    }

    async addTitle(title: string, options: {
        x?: number;
        y?: number;
        fontSize?: number;
        color?: string;
    } = {}): Promise<void> {
        if (!this.currentSlide) return;
        
        this.currentSlide.addText(title, {
            x: options.x ?? 0.5,
            y: options.y ?? 0.5,
            w: '90%',
            h: 1,
            fontSize: options.fontSize ?? 36,
            color: options.color ?? '363636',
            fontFace: 'Arial',
            bold: true,
        });
    }

    async addText(text: string, options: {
        x?: number;
        y?: number;
        w?: number;
        h?: number;
        fontSize?: number;
        color?: string;
    } = {}): Promise<void> {
        if (!this.currentSlide) return;

        this.currentSlide.addText(text, {
            x: options.x ?? 0.5,
            y: options.y ?? 2,
            w: options.w ?? '90%',
            h: options.h ?? 2,
            fontSize: options.fontSize ?? 18,
            color: options.color ?? '363636',
            fontFace: 'Arial',
        });
    }

    async addTable(tableData: TableData): Promise<void> {
        if (!this.currentSlide) return;

        const tableRows = [
            tableData.headers,
            ...tableData.rows.map(row => row.map(cell => ({ text: String(cell) })))
        ];

        this.currentSlide.addTable(tableRows, {
            colW: tableData.columnWidths || tableData.headers.map(() => 2),
            fontSize: 10,
            color: '363636',
            border: { pt: 0.5, color: 'CCCCCC' },
            headerFill: DEFAULT_COLORS.primary,
            headerColor: 'FFFFFF',
        });
    }

    async addChart(chartData: ChartData): Promise<void> {
        if (!this.currentSlide) return;

        const chartTypeMap: Record<string, string> = {
            bar: 'bar',
            line: 'line',
            pie: 'pie',
            area: 'area',
            radar: 'radar',
            scatter: 'scatter',
        };

        const data = chartData.labels.map((label, i) => {
            const row: Record<string, any> = { name: label };
            chartData.datasets.forEach(ds => {
                row[ds.name] = ds.values[i];
            });
            return row;
        });

        this.currentSlide.addChart(chartTypeMap[chartData.type] || 'bar', data, {
            x: 1,
            y: 2,
            w: 8,
            h: 5,
            title: chartData.title,
            showDataTable: chartData.showDataLabels,
        });
    }

    async addImage(options: ImageOptions): Promise<void> {
        if (!this.currentSlide) return;

        let imageData;

        if (options.url) {
            const response = await fetch(options.url);
            const arrayBuffer = await response.arrayBuffer();
            imageData = Buffer.from(arrayBuffer);
        } else if (options.base64) {
            imageData = Buffer.from(options.base64, 'base64');
        }

        if (imageData) {
            this.currentSlide.addImage({
                data: imageData,
                x: options.x ?? 1,
                y: options.y ?? 1,
                w: options.width ?? 5,
                h: options.height ?? 4,
            });
        }
    }

    generate(): Uint8Array {
        return this.presentation.write('buffer') as Uint8Array;
    }

    generateBase64(): string {
        const buffer = this.generate();
        return Buffer.from(buffer).toString('base64');
    }

    async save(path: string): Promise<void> {
        this.presentation.writeFile({ fileName: path });
    }
}

export async function generateDocument(
    type: 'pdf' | 'xlsx' | 'pptx',
    options: DocumentOptions & {
        content?: string;
        table?: TableData;
        chart?: ChartData;
        image?: ImageOptions;
    }
): Promise<{ data: Uint8Array; base64: string; mimeType: string }> {
    let data: Uint8Array;
    let mimeType: string;
    let base64: string;

    switch (type) {
        case 'pdf': {
            const pdf = new AdvancedPDFEngine();
            await pdf.initialize(options as PageOptions);
            
            if (options.watermark) {
                await pdf.addWatermark(options.watermark);
            }
            
            if (options.content) {
                await pdf.addText(options.content);
            }
            
            if (options.table) {
                await pdf.addTable(options.table);
            }
            
            if (options.chart) {
                await pdf.addChart(options.chart);
            }
            
            if (options.image) {
                await pdf.addImage(options.image);
            }
            
            pdf.setDocumentMetadata(options);
            data = await pdf.generate();
            base64 = await pdf.generateBase64();
            mimeType = 'application/pdf';
            break;
        }
        case 'xlsx': {
            const xlsx = new ExcelGenerator();
            xlsx.initialize();
            
            if (options.table) {
                await xlsx.addTable(options.table);
            }
            
            data = xlsx.generate();
            base64 = xlsx.generateBase64();
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
        }
        case 'pptx': {
            const pptx = new PowerPointGenerator();
            await pptx.initialize();
            await pptx.addSlide();
            
            if (options.content) {
                await pptx.addText(options.content);
            }
            
            if (options.table) {
                await pptx.addTable(options.table);
            }
            
            if (options.chart) {
                await pptx.addChart(options.chart);
            }
            
            data = pptx.generate();
            base64 = pptx.generateBase64();
            mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            break;
        }
        default:
            throw new Error(`Unsupported document type: ${type}`);
    }

    return { data, base64, mimeType };
}