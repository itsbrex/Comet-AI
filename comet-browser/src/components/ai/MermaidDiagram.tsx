import React, { useEffect, useRef, memo } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'inherit',
  themeVariables: {
    primaryColor: '#0ea5e9',
    primaryTextColor: '#fff',
    primaryBorderColor: '#0ea5e9',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    background: '#0f172a',
    mainBkg: '#1e293b',
    nodeBorder: '#0ea5e9',
    clusterBkg: '#1e293b',
    clusterBorder: '#334155',
    titleColor: '#fff',
    edgeLabelBackground: '#0f172a',
  },
});

interface MermaidDiagramProps {
  diagramId: string;
  code: string;
}

const MermaidDiagram = memo(function MermaidDiagram({ diagramId, code }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (renderedRef.current) return;
    renderedRef.current = true;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'inherit',
      themeVariables: {
        primaryColor: '#0ea5e9',
        primaryTextColor: '#fff',
        primaryBorderColor: '#0ea5e9',
        lineColor: '#64748b',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
        background: '#0f172a',
        mainBkg: '#1e293b',
        nodeBorder: '#0ea5e9',
        clusterBkg: '#1e293b',
        clusterBorder: '#334155',
        titleColor: '#fff',
        edgeLabelBackground: '#0f172a',
      },
    });

    const renderDiagram = async () => {
      if (!containerRef.current) return;
      
      try {
        const id = `mermaid-${diagramId}`;
        const { svg } = await mermaid.render(id, code);
        containerRef.current.innerHTML = svg;
      } catch (err) {
        console.error('[Mermaid] Render error:', err);
        containerRef.current.innerHTML = `
          <div class="text-red-400 text-sm p-4 bg-red-900/20 rounded-lg border border-red-500/30">
            <p class="font-bold">Diagram Error</p>
            <p class="text-xs mt-1">${err instanceof Error ? err.message : 'Invalid Mermaid syntax'}</p>
            <pre class="mt-2 text-xs text-white/60 overflow-x-auto">${code.slice(0, 500)}</pre>
          </div>
        `;
      }
    };

    renderDiagram();
  }, [diagramId, code]);

  return (
    <div className="my-5 rounded-3xl overflow-hidden border border-white/5 bg-slate-900/50 p-6 flex flex-col items-center shadow-2xl">
      <div
        ref={containerRef}
        className="mermaid-container w-full flex justify-center"
        style={{ minHeight: '100px' }}
      />
    </div>
  );
});

export default MermaidDiagram;