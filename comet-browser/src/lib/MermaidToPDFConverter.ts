/**
 * Mermaid to PDF/Image Converter
 * Renders Mermaid diagrams to PDF, PNG, or SVG
 */

import { AdvancedPDFEngine } from './AdvancedDocumentEngine';

export interface MermaidOptions {
    theme?: 'default' | 'dark' | 'forest' | 'neutral' | 'base';
    type?: 'pdf' | 'png' | 'svg';
    width?: number;
    height?: number;
    backgroundColor?: string;
    fontFamily?: string;
    fontSize?: number;
    title?: string;
    caption?: string;
}

export interface MermaidDiagram {
    code: string;
    title?: string;
    options?: MermaidOptions;
}

const DEFAULT_MERMAID_THEMES = {
    default: {
        background: '#ffffff',
        primaryColor: '#4F46E5',
        secondaryColor: '#7C3AED',
        tertiaryColor: '#F59E0B',
        mainBkg: '#4F46E5',
        secondBkg: '#4F46E5',
        lineColor: '#4F46E5',
        fontFamily: 'Helvetica',
    },
    dark: {
        background: '#1a1a2e',
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        tertiaryColor: '#f59e0b',
        mainBkg: '#6366f1',
        secondBkg: '#6366f1',
        lineColor: '#6366f1',
        fontFamily: 'Helvetica',
    },
    forest: {
        background: '#f0fff0',
        primaryColor: '#228b22',
        secondaryColor: '#006400',
        tertiaryColor: '#8b4513',
        mainBkg: '#228b22',
        secondBkg: '#228b22',
        lineColor: '#228b22',
        fontFamily: 'Helvetica',
    },
    neutral: {
        background: '#f5f5f5',
        primaryColor: '#333333',
        secondaryColor: '#666666',
        tertiaryColor: '#999999',
        mainBkg: '#333333',
        secondBkg: '#333333',
        lineColor: '#333333',
        fontFamily: 'Helvetica',
    },
    base: {
        background: '#ffffff',
        primaryColor: '#4F46E5',
        secondaryColor: '#10B981',
        tertiaryColor: '#F59E0B',
        mainBkg: '#4F46E5',
        secondBkg: '#10B981',
        lineColor: '#4F46E5',
        fontFamily: 'Helvetica',
    },
};

export class MermaidToPDFConverter {
    private baseImageWidth = 800;
    private baseImageHeight = 600;

    async renderToSVG(mermaidCode: string, options: MermaidOptions = {}): Promise<string> {
        const theme = this.getThemeConfig(options.theme || 'default');
        const svg = this.generateSVGFromCode(mermaidCode, theme, options);
        return svg;
    }

    async renderToImage(mermaidCode: string, options: MermaidOptions = {}): Promise<Uint8Array> {
        const theme = this.getThemeConfig(options.theme || 'default');
        const svg = this.generateSVGFromCode(mermaidCode, theme, options);

        if (options.type === 'svg') {
            const encoder = new TextEncoder();
            return encoder.encode(svg);
        }

        return this.svgToPngBuffer(svg, options);
    }

    async renderToPDF(
        diagrams: MermaidDiagram[],
        options: {
            title?: string;
            author?: string;
            pageSize?: 'A4' | 'LETTER' | 'LEGAL';
            orientation?: 'portrait' | 'landscape';
            pageNumbers?: boolean;
            header?: string;
            footer?: string;
        } = {}
    ): Promise<Uint8Array> {
        const pdf = new AdvancedPDFEngine();
        await pdf.initialize({
            size: options.pageSize || 'A4',
            orientation: options.orientation || 'portrait',
        });

        pdf.setDocumentMetadata({
            title: options.title || 'Mermaid Diagrams',
            author: options.author || 'Comet AI',
        });

        if (options.header) {
            await pdf.addText(options.header, { y: 780, size: 10, color: '#666666' });
        }

        for (let i = 0; i < diagrams.length; i++) {
            const diagram = diagrams[i];
            const theme = this.getThemeConfig(diagram.options?.theme || 'default');

            const svg = this.generateSVGFromCode(diagram.code, theme, diagram.options || {});
            const imageBuffer = await this.svgToPngBuffer(svg, diagram.options || {});

            const base64 = btoa(
                String.fromCharCode(...new Uint8Array(imageBuffer))
            );

            if (diagram.title) {
                await pdf.addText(diagram.title, {
                    y: pdf['currentPage']?.getSize?.()[1] - 100 || 780,
                    size: 14,
                    font: 'helveticaBold',
                });
            }

            if (diagram.options?.caption) {
                await pdf.addText(diagram.options.caption, {
                    y: 50,
                    size: 10,
                    color: '#666666',
                });
            } else if (diagram.title) {
                await pdf.addImage({
                    base64,
                    x: 50,
                    y: 150,
                    width: 500,
                    height: 300,
                    keepAspectRatio: true,
                });
            }

            if (options.pageNumbers && i < diagrams.length - 1) {
                await pdf.addText(`Page ${i + 1}`, {
                    y: 30,
                    size: 9,
                    color: '#999999',
                });
            }

            if (i < diagrams.length - 1) {
                await pdf.addPageBreak();
            }
        }

        return await pdf.generate();
    }

    private getThemeConfig(themeName: string): Record<string, string> {
        return DEFAULT_MERMAID_THEMES[themeName as keyof typeof DEFAULT_MERMAID_THEMES] || 
            DEFAULT_MERMAID_THEMES.default;
    }

    private generateSVGFromCode(
        code: string,
        theme: Record<string, string>,
        options: MermaidOptions
    ): string {
        const width = options.width || this.baseImageWidth;
        const height = options.height || this.baseImageHeight;

        const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style type="text/css">
      .node rect, .node circle, .node polygon { fill: ${theme.primaryColor}; stroke: ${theme.primaryColor}; }
      .node .label { fill: #ffffff; font-family: ${theme.fontFamily}; font-size: 14px; }
      .edgePath path { stroke: ${theme.lineColor}; stroke-width: 2px; }
      .marker { fill: ${theme.lineColor}; }
      .labelText { fill: ${theme.primaryColor}; font-family: ${theme.fontFamily}; font-size: 12px; }
      text { fill: ${theme.primaryColor}; font-family: ${theme.fontFamily}; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="${options.backgroundColor || theme.background}"/>`;

        const svgFooter = '</svg>';

        const diagramSVG = this.parseMermaidToSVG(code, width, height, theme);

        return svgHeader + diagramSVG + svgFooter;
    }

    private parseMermaidToSVG(
        code: string,
        width: number,
        height: number,
        theme: Record<string, string>
    ): string {
        const lines = code.trim().split('\n');
        const type = lines[0]?.toLowerCase().replace(/^mermaid/, '').trim() || 'graph';
        
        let svgContent = '';
        
        const nodePattern = /^([A-Za-z0-9_]+)\s*\[([^\]]+)\]/;
        const edgePattern = /^([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/;
        const subgraphPattern = /^subgraph\s+(\w+)/;
        
        const nodes: Map<string, { label: string; x: number; y: number }> = new Map<string, { label: string; x: number; y: number }>();
        const edges: Array<{ from: string; to: string; label?: string }> = [];
        
        let currentY = 80;
        let nodeId = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('rect')) continue;
            
            const nodeMatch = trimmed.match(nodePattern);
            if (nodeMatch) {
                const [, id, label] = nodeMatch;
                nodes.set(id, {
                    label: label.replace(/^["']|["']$/g, ''),
                    x: 100 + (nodeId % 3) * 200,
                    y: currentY,
                });
                nodeId++;
                if (nodeId % 3 === 0) currentY += 80;
            }

            const edgeMatch = trimmed.match(edgePattern);
            if (edgeMatch) {
                const [, from, to] = edgeMatch;
                const labelMatch = trimmed.match(/-->\s*\|([^|]+)\|\s*(\w+)/);
                edges.push({
                    from,
                    to,
                    label: labelMatch?.[1],
                });
            }

            const titleMatch = trimmed.match(/^title:\s*(.+)/);
            if (titleMatch) {
                svgContent += `
        <text x="${width / 2}" y="40" text-anchor="middle" 
              font-size="18" font-weight="bold" fill="${theme.primaryColor}">
          ${titleMatch[1]}
        </text>`;
            }
        }

        for (const [, node] of nodes) {
            const boxWidth = node.label.length * 8 + 30;
            const boxHeight = 40;
            
            svgContent += `
        <g class="node" transform="translate(${node.x}, ${node.y})">
          <rect x="0" y="0" width="${boxWidth}" height="${boxHeight}" rx="5" ry="5"
                fill="${theme.primaryColor}" stroke="${theme.primaryColor}"/>
          <text x="${boxWidth / 2}" y="${boxHeight / 2 + 5}" text-anchor="middle" 
                fill="#ffffff" font-size="12" font-family="${theme.fontFamily}">
            ${node.label}
          </text>
        </g>`;
        }

        for (const edge of edges) {
            const fromNode = nodes.get(edge.from);
            const toNode = nodes.get(edge.to);
            
            if (fromNode && toNode) {
                svgContent += `
        <line x1="${fromNode.x + 50}" y1="${fromNode.y + 20}" 
              x2="${toNode.x}" y2="${toNode.y + 20}"
              stroke="${theme.lineColor}" stroke-width="2" marker-end="url(#arrow)"/>`;
                
                if (edge.label) {
                    const midX = (fromNode.x + 50 + toNode.x) / 2;
                    const midY = (fromNode.y + toNode.y) / 2 + 20;
                    svgContent += `
        <text x="${midX}" y="${midY}" text-anchor="middle" 
              fill="${theme.tertiaryColor}" font-size="10">
          ${edge.label}
        </text>`;
                }
            }
        }

        if (svgContent === '') {
            svgContent = `
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" 
              fill="${theme.primaryColor}" font-size="14">
          Diagram: ${type}
        </text>`;
        }

        return svgContent;
    }

    private async svgToPngBuffer(svg: string, options: MermaidOptions): Promise<Uint8Array> {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        canvas.width = options.width || this.baseImageWidth;
        canvas.height = options.height || this.baseImageHeight;

        const img = new Image();
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        return new Promise((resolve, reject) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                
                const dataUrl = canvas.toDataURL('image/png');
                const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
                
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                
                resolve(bytes);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(new Uint8Array());
            };
            
            img.src = url;
        });
    }
}

export async function createDiagramPDF(
    diagrams: MermaidDiagram[],
    outputPath?: string
): Promise<{ data: Uint8Array; base64: string }> {
    const converter = new MermaidToPDFConverter();
    const data = await converter.renderToPDF(diagrams);
    const base64 = Buffer.from(data).toString('base64');

    if (outputPath) {
        const fs = require('fs');
        fs.writeFileSync(outputPath, data);
    }

    return { data, base64 };
}

export async function createDiagramImage(
    mermaidCode: string,
    options: MermaidOptions = {}
): Promise<{ data: Uint8Array; base64: string; type: string }> {
    const converter = new MermaidToPDFConverter();
    const data = await converter.renderToImage(mermaidCode, options);
    const base64 = Buffer.from(data).toString('base64');
    const type = options.type === 'svg' ? 'image/svg+xml' : 'image/png';

    return { data, base64, type };
}