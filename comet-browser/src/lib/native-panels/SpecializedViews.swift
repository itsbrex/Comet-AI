import SwiftUI
import WebKit

struct RichMarkdownView: NSViewRepresentable {
    let content: String
    let appearance: String
    
    class Coordinator: NSObject, WKNavigationDelegate {
        var lastContent: String = ""
        var webView: WKWebView?
        
        func updateContent(_ content: String, isDark: Bool) {
            guard let webView = webView else { return }
            
            // If content is empty/new or drastically different, do a full load
            if lastContent.isEmpty || abs(content.count - lastContent.count) > 1000 {
                let html = generateHTML(content: content, isDark: isDark)
                webView.loadHTMLString(html, baseURL: nil)
            } else {
                // For small incremental updates (streaming), inject via JS for "instant" feel
                let escaped = content
                    .replacingOccurrences(of: "\\", with: "\\\\")
                    .replacingOccurrences(of: "'", with: "\\'")
                    .replacingOccurrences(of: "\n", with: "\\n")
                    .replacingOccurrences(of: "\r", with: "")
                
                let js = "if (window.updateContent) { window.updateContent('\(escaped)'); } else { window.location.reload(); }"
                webView.evaluateJavaScript(js)
            }
            lastContent = content
        }
        
        private func generateHTML(content: String, isDark: Bool) -> String {
            let escapedContent = content
                .replacingOccurrences(of: "&", with: "&amp;")
                .replacingOccurrences(of: "<", with: "&lt;")
                .replacingOccurrences(of: ">", with: "&gt;")
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
                .replacingOccurrences(of: "\n", with: "\\n")
            
            let textColor = isDark ? "#ffffff" : "#1a1a1a"
            let codeBg = isDark ? "#2d2d3d" : "#f5f5f5"
            let accentColor = "#6366f1"
            
            return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
                <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'Outfit', sans-serif;
                        color: \(textColor);
                        background: transparent;
                        line-height: 1.6;
                        font-size: 14px;
                        padding: 0;
                        overflow-x: hidden;
                    }
                    #content {
                        white-space: pre-wrap;
                        word-break: break-word;
                    }
                    pre {
                        background: \(codeBg);
                        padding: 12px;
                        border-radius: 8px;
                        overflow-x: auto;
                        margin: 12px 0;
                        font-family: 'JetBrains Mono', 'Fira Code', monospace;
                        font-size: 13px;
                    }
                    code {
                        font-family: 'JetBrains Mono', 'Fira Code', monospace;
                        background: \(codeBg);
                        padding: 2px 4px;
                        border-radius: 4px;
                    }
                    blockquote {
                        border-left: 4px solid \(accentColor);
                        padding-left: 12px;
                        color: \(isDark ? "#a1a1aa" : "#4b5563");
                        margin: 12px 0;
                    }
                    #thinking-indicator {
                        color: \(accentColor);
                        font-style: italic;
                        font-size: 12px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    @keyframes pulse {
                        0% { opacity: 0.4; }
                        50% { opacity: 1; }
                        100% { opacity: 0.4; }
                    }
                    .dot { animation: pulse 1.5s infinite; }
                    .dot:nth-child(2) { animation-delay: 0.2s; }
                    .dot:nth-child(3) { animation-delay: 0.4s; }
                </style>
            </head>
            <body>
                <div id="content">\(escapedContent)</div>
                <script>
                    window.updateContent = function(newContent) {
                        const contentDiv = document.getElementById('content');
                        contentDiv.innerText = newContent;
                        renderMathInElement(contentDiv, {
                            delimiters: [
                                {left: '$$', right: '$$', display: true},
                                {left: '$', right: '$', display: false},
                                {left: '\\\\(', right: '\\\\)', display: false},
                                {left: '\\\\[', right: '\\\\]', display: true}
                            ],
                            throwOnError: false
                        });
                    };
                    
                    document.addEventListener("DOMContentLoaded", function() {
                        window.updateContent(document.getElementById('content').innerText);
                    });
                </script>
            </body>
            </html>
            """
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.setValue(false, forKey: "drawsBackground")
        context.coordinator.webView = webView
        return webView
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        let isDark = appearance != "light"
        context.coordinator.updateContent(content, isDark: isDark)
    }
}

struct MermaidView: NSViewRepresentable {
    let diagram: String
    let appearance: String
    
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.setValue(false, forKey: "drawsBackground")
        return webView
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        let isDark = appearance != "light"
        let html = generateMermaidHTML(diagram: diagram, isDark: isDark)
        nsView.loadHTMLString(html, baseURL: nil)
    }
    
    private func generateMermaidHTML(diagram: String, isDark: Bool) -> String {
        let escapedDiagram = diagram
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "`", with: "\\`")
            .replacingOccurrences(of: "$", with: "\\$")
        
        let textColor = isDark ? "#ffffff" : "#1a1a1a"
        let primaryColor = "#6366f1"
        let secondaryColor = "#8b5cf6"
        let lineColor = isDark ? "#4a4a6a" : "#d1d5db"
        
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', sans-serif;
                    background: transparent;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100px;
                    padding: 16px;
                }
                .mermaid {
                    color-scheme: \(isDark ? "dark" : "light");
                }
            </style>
        </head>
        <body>
            <pre class="mermaid">
            \(escapedDiagram)
            </pre>
            <script>
                mermaid.initialize({
                    startOnLoad: true,
                    theme: '\(isDark ? "dark" : "default")',
                    themeVariables: {
                        primaryColor: '\(primaryColor)',
                        primaryTextColor: '\(textColor)',
                        primaryBorderColor: '\(lineColor)',
                        lineColor: '\(lineColor)',
                        secondaryColor: '\(secondaryColor)',
                        tertiaryColor: '\(isDark ? "#2d2d3d" : "#f5f5f5")'
                    },
                    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
                    securityLevel: 'loose'
                });
            </script>
        </body>
        </html>
        """
    }
}

struct AnimatedMarkdownMessageText: View {
    let content: String
    let appearance: String
    let animate: Bool

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var visibleLength = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            MarkdownMessageText(content: visibleContent, appearance: appearance)

            if showCaret {
                HStack(spacing: 6) {
                    Capsule()
                        .fill(PanelPalette(appearance: appearance).accent)
                        .frame(width: 4, height: 16)
                    Text("Comet is writing...")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundStyle(PanelPalette(appearance: appearance).secondaryText)
                }
            }
        }
        .task(id: content) {
            if animate && !reduceMotion {
                await animateToLatestContent()
            } else {
                visibleLength = content.count
            }
        }
    }

    private var visibleContent: String {
        if !animate || reduceMotion { return content }
        return String(content.prefix(visibleLength))
    }

    private var showCaret: Bool {
        animate && !reduceMotion && visibleLength < content.count
    }

    private func animateToLatestContent() async {
        while visibleLength < content.count {
            visibleLength += 2
            try? await Task.sleep(nanoseconds: 10_000_000)
        }
    }
}

struct MarkdownMessageText: View {
    let content: String
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        
        Group {
            if containsComplexElements(content) {
                RichMarkdownView(content: content, appearance: appearance)
            } else {
                Text(content)
                    .font(.system(size: 14, design: .rounded))
                    .foregroundStyle(palette.primaryText)
            }
        }
    }
    
    private func containsComplexElements(_ text: String) -> Bool {
        let patterns = ["\\$\\$", "\\\\begin", "```", "\\|", "###"]
        return patterns.contains { text.contains($0) }
    }
}
