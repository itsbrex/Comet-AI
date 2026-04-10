import SwiftUI

struct MessageBubbleView: View {
    let message: NativePanelState.Message
    let appearance: String
    let animateContent: Bool

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        let parseResult = AICommandParser.parseCommands(from: message.content)
        let visibleContent = AICommandParser.cleanCustomTags(from: parseResult.hasCommands ? parseResult.textWithoutCommands : message.content)
        let reasoningBlocks = resolvedReasoning
        let ocrText = AICommandParser.extractOCRText(from: message)
        let actionLogs = AICommandParser.extractActionLogs(from: message)
        let mediaItems = AICommandParser.extractMediaItems(from: message)

        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .center, spacing: 6) {
                Image(systemName: message.role == "user" ? "person.circle.fill" : "sparkles")
                    .font(.system(size: 12))
                    .foregroundStyle(message.role == "user" ? palette.accent : palette.secondaryAccent)
                
                Text(message.role == "user" ? "You" : "Comet")
                    .font(.system(size: 10, weight: .black, design: .rounded))
                    .foregroundStyle(message.role == "user" ? palette.accent : palette.secondaryAccent)
                    .textCase(.uppercase)
                    .tracking(0.5)
                
                Spacer()
                
                if let ts = message.timestamp {
                    Text(formatTime(ts))
                        .font(.system(size: 9))
                        .foregroundStyle(palette.secondaryText.opacity(0.8))
                }
            }

            if message.role != "user" {
                ForEach(reasoningBlocks, id: \.self) { reasoning in
                    ThinkingIndicatorView(appearance: appearance, thought: reasoning)
                }
            }

            if parseResult.hasCommands && message.role != "user" {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(parseResult.commands) { command in
                        CommandTagView(command: command, appearance: appearance)
                    }
                }
                .padding(.vertical, 4)
            }

            if !visibleContent.isEmpty {
                AnimatedMarkdownMessageText(
                    content: visibleContent,
                    appearance: appearance,
                    animate: animateContent
                )
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let ocrText, !ocrText.isEmpty {
                OCRResultCard(label: message.ocrLabel ?? "OCR_RESULT", content: ocrText, appearance: appearance)
            }

            if !actionLogs.isEmpty {
                ActionLogCard(actionLogs: actionLogs, appearance: appearance)
            }

            if !mediaItems.isEmpty {
                MediaAttachmentGroup(items: mediaItems, appearance: appearance)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(message.role == "user" ? palette.accent.opacity(0.15) : palette.isDark ? Color(hex: "#121214").opacity(0.9) : Color.white.opacity(0.9))
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(message.role == "user" ? palette.accent.opacity(0.3) : palette.border, lineWidth: 1)
                )
        )
        .padding(.horizontal, 2)
    }

    private var resolvedReasoning: [String] {
        var values: [String] = []
        if let thinkText = message.thinkText?.trimmingCharacters(in: .whitespacesAndNewlines), !thinkText.isEmpty {
            values.append(thinkText)
        }
        values.append(contentsOf: AICommandParser.extractReasoning(from: message.content))
        var seen = Set<String>()
        return values.filter { value in
            guard !value.isEmpty, !seen.contains(value) else { return false }
            seen.insert(value)
            return true
        }
    }
    
    private func formatTime(_ timestamp: Double) -> String {
        let date = Date(timeIntervalSince1970: timestamp / 1000)
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct ThinkingIndicatorView: View {
    let appearance: String
    let thought: String?
    @State private var isExpanded = false
    
    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 8) {
            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    isExpanded.toggle()
                }
            } label: {
                HStack(spacing: 8) {
                    Circle()
                        .fill(palette.accent.opacity(0.5))
                        .frame(width: 6, height: 6)
                    
                    Text(isExpanded ? "Thinking Process" : "View Thinking Process")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(palette.accent)
                    
                    Image(systemName: "chevron.down")
                        .font(.system(size: 10))
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                }
            }
            .buttonStyle(.plain)
            
            if isExpanded, let thought = thought {
                Text(thought)
                    .font(.system(size: 12, design: .rounded))
                    .foregroundStyle(palette.secondaryText)
                    .lineSpacing(4)
                    .padding(12)
                    .background(palette.mutedSurface.opacity(0.5))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }
}

struct OCRResultCard: View {
    let label: String
    let content: String
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 10) {
            Label(label.replacingOccurrences(of: "_", with: " "), systemImage: "viewfinder")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundStyle(Color.orange)
            
            ScrollView(.vertical, showsIndicators: true) {
                Text(content)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(palette.primaryText)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(maxHeight: 180)
        }
        .padding(12)
        .background(Color.orange.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.orange.opacity(0.3), lineWidth: 1))
    }
}

struct ActionLogCard: View {
    let actionLogs: [NativePanelState.ActionLog]
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 10) {
            Label("Action Execution", systemImage: "point.3.filled.connected.trianglepath.dotted")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundStyle(palette.secondaryAccent)

            ForEach(Array(actionLogs.enumerated()), id: \.offset) { index, log in
                HStack(spacing: 8) {
                    Circle().fill(log.success ? Color.green : Color.red).frame(width: 6, height: 6)
                    Text(log.type.replacingOccurrences(of: "_", with: " ")).font(.system(size: 11, weight: .bold))
                    Spacer()
                    Text(log.success ? "Done" : "Failed").font(.system(size: 9))
                }
                .padding(8)
                .background(palette.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding(12)
        .background(palette.mutedSurface.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

struct MediaAttachmentGroup: View {
    let items: [NativePanelState.MediaItem]
    let appearance: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(items, id: \.stableId) { item in
                MediaAttachmentCard(item: item, appearance: appearance)
            }
        }
    }
}

struct MediaAttachmentCard: View {
    let item: NativePanelState.MediaItem
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: item.type == "mermaid" ? "diagram.project" : "paperclip")
                    .font(.system(size: 10))
                Text(item.type.uppercased())
                    .font(.system(size: 8, weight: .black))
                Spacer()
                
                if item.type == "image" || item.type.contains("gen") {
                    HStack(spacing: 8) {
                        Button {
                            // Download logic
                            if let urlStr = item.url, let url = URL(string: urlStr) {
                                NSWorkspace.shared.open(url)
                            }
                        } label: {
                            Image(systemName: "arrow.down.circle")
                                .font(.system(size: 14))
                        }
                        .buttonStyle(.plain)
                        .help("Download Image")
                        
                        Button {
                            // Share logic
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 14))
                        }
                        .buttonStyle(.plain)
                        .help("Share Image")
                    }
                }
            }
            .foregroundStyle(palette.accent)
            
            if item.type == "image" || item.type.contains("gen"), let urlString = item.url {
                MediaImageLoader(urlString: urlString, palette: palette)
            } else if let url = item.url {
                Text(url)
                    .font(.system(size: 10))
                    .foregroundStyle(palette.secondaryText)
                    .lineLimit(1)
            }
        }
        .padding(12)
        .background(palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(palette.border, lineWidth: 1))
    }
}

struct MediaImageLoader: View {
    let urlString: String
    let palette: PanelPalette
    @State private var image: NSImage?
    @State private var isLoading = true
    
    var body: some View {
        Group {
            if let image = image {
                Image(nsImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .transition(.opacity.combined(with: .scale(scale: 0.95)))
            } else if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, minHeight: 200)
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "photo.fill")
                        .font(.system(size: 32))
                    Text("Unable to load image")
                        .font(.system(size: 11, weight: .bold))
                }
                .foregroundStyle(palette.secondaryText)
                .frame(maxWidth: .infinity, minHeight: 200)
                .background(palette.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .onAppear { loadImage() }
    }
    
    private func loadImage() {
        guard let url = URL(string: urlString) else {
            isLoading = false
            return
        }
        
        // Handle file URLs specially
        if url.scheme == "file" {
            if let data = try? Data(contentsOf: url), let nsImage = NSImage(data: data) {
                self.image = nsImage
                self.isLoading = false
            } else {
                // Try direct path if URL(string:) failed file scheme
                let path = urlString.replacingOccurrences(of: "file://", with: "")
                if let nsImage = NSImage(contentsOfFile: path) {
                    self.image = nsImage
                }
                self.isLoading = false
            }
        } else {
            // Network image
            Task {
                do {
                    let (data, _) = try await URLSession.shared.data(from: url)
                    if let nsImage = NSImage(data: data) {
                        await MainActor.run {
                            self.image = nsImage
                            self.isLoading = false
                        }
                    }
                } catch {
                    await MainActor.run { self.isLoading = false }
                }
            }
        }
    }
}


struct CommandTagView: View {
    let command: CommandInfo
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        HStack(spacing: 6) {
            Image(systemName: "command")
                .font(.system(size: 10))
            Text(command.type.replacingOccurrences(of: "_", with: " "))
                .font(.system(size: 10, weight: .bold))
            if !command.value.isEmpty {
                Text(command.value).font(.system(size: 9)).lineLimit(1).foregroundStyle(palette.primaryText.opacity(0.7))
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(palette.accent.opacity(0.12))
        .foregroundStyle(palette.accent)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(palette.accent.opacity(0.2), lineWidth: 1))
    }
}
