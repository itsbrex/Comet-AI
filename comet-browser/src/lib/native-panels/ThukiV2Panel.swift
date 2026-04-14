import SwiftUI
import AppKit

struct ThukiV2Panel: View {
    @ObservedObject var viewModel: NativePanelViewModel
    @State private var query: String = ""
    @State private var isGenerating: Bool = false
    @State private var isHistoryOpen: Bool = false
    @State private var showCommandSuggestions: Bool = false
    @State private var attachedImages: [AttachedImageItem] = []
    @State private var selectedContext: String?
    @State private var conversations: [ConversationSummary] = []
    @State private var messages: [ChatMessage] = []
    @State private var pendingUserMessage: ChatMessage?
    @State private var screenCapturePending: Bool = false
    @State private var captureError: String?
    @State private var commandPrefix: String = ""
    @State private var highlightedCommandIndex: Int = 0
    
    private let COMMANDS: [CommandItem] = [
        CommandItem(trigger: "/screen", description: "Capture screen and attach"),
        CommandItem(trigger: "/think", description: "Enable thinking mode"),
        CommandItem(trigger: "/search", description: "Search the web"),
        CommandItem(trigger: "/summarize", description: "Summarize content"),
        CommandItem(trigger: "/translate", description: "Translate text"),
        CommandItem(trigger: "/explain", description: "Explain code/concept"),
        CommandItem(trigger: "/rewrite", description: "Rewrite selected text"),
    ]
    
    private let MAX_IMAGES = 3
    
    var isChatMode: Bool {
        !messages.isEmpty || isGenerating
    }
    
    var filteredCommands: [CommandItem] {
        COMMANDS.filter { cmd in
            cmd.trigger.lowercased().hasPrefix(commandPrefix.lowercased())
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            if isChatMode {
                chatView
            } else {
                askBarMode
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.clear)
    }
    
    // MARK: - Ask Bar Mode (Thuki-inspired Spotlight Style)
    
    private var askBarMode: some View {
        VStack(spacing: 0) {
            Spacer()
            
            VStack(spacing: 12) {
                if let context = selectedContext, !context.isEmpty {
                    quotedTextView(context)
                }
                
                if !attachedImages.isEmpty {
                    imageThumbnailsView
                }
                
                commandSuggestionsView
                
                askBarInput
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 20)
        }
    }
    
    private func quotedTextView(_ text: String) -> some View {
        Text("\"\(String(text.prefix(200)))\"")
            .font(.system(size: 12))
            .foregroundColor(.secondary)
            .italic()
            .lineLimit(3)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.primary.opacity(0.05))
            .cornerRadius(8)
    }
    
    private var imageThumbnailsView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(attachedImages) { img in
                    ZStack(alignment: .topTrailing) {
                        Group {
                            if let nsImage = img.uiImage {
                                Image(nsImage: nsImage)
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            } else {
                                Rectangle()
                                    .fill(Color.secondary.opacity(0.3))
                                    .overlay(
                                        ProgressView()
                                    )
                            }
                        }
                        .frame(width: 56, height: 56)
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.primary.opacity(0.1), lineWidth: 1)
                        )
                        
                        Button(action: { removeImage(id: img.id) }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.white)
                                .background(Circle().fill(Color.black.opacity(0.6)))
                        }
                        .offset(x: 4, y: -4)
                    }
                }
            }
            .padding(.horizontal, 12)
        }
    }
    
    private var commandSuggestionsView: some View {
        Group {
            if showCommandSuggestions && !filteredCommands.isEmpty {
                VStack(spacing: 0) {
                    ForEach(Array(filteredCommands.enumerated()), id: \.element.trigger) { index, cmd in
                        Button(action: {
                            selectCommand(cmd.trigger)
                        }) {
                            HStack {
                                Text(cmd.trigger)
                                    .font(.system(size: 13, weight: .medium, design: .monospaced))
                                    .foregroundColor(.primary)
                                Text(cmd.description)
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                                Spacer()
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(index == highlightedCommandIndex ? Color.accentColor.opacity(0.2) : Color.clear)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .background(Color.primary.opacity(0.05))
                .cornerRadius(8)
                .padding(.horizontal, 12)
            }
        }
    }
    
    private var askBarInput: some View {
        HStack(spacing: 12) {
            Image(systemName: "sparkles")
                .font(.system(size: 18))
                .foregroundColor(.accentColor)
                .frame(width: 40, height: 40)
                .background(Color.accentColor.opacity(0.1))
                .cornerRadius(10)
            
            if !isHistoryOpen {
                Button(action: { isHistoryOpen = true }) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                        .frame(width: 28, height: 28)
                }
                .buttonStyle(.plain)
            }
            
            TextField("Ask Comet anything...", text: $query, axis: .vertical)
                .textFieldStyle(.plain)
                .font(.system(size: 14))
                .lineLimit(1...6)
                .onChange(of: query) { _, newValue in
                    handleQueryChange(newValue)
                }
                .onSubmit {
                    submitQuery()
                }
            
            Button(action: handleScreenshot) {
                Image(systemName: "camera.fill")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .frame(width: 28, height: 28)
            }
            .buttonStyle(.plain)
            .disabled(attachedImages.count >= MAX_IMAGES)
            
            submitButton
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.primary.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.primary.opacity(0.15), lineWidth: 1)
                )
        )
    }
    
    private var submitButton: some View {
        Button(action: {
            if isGenerating {
                cancelGeneration()
            } else {
                submitQuery()
            }
        }) {
            ZStack {
                if isGenerating {
                    Circle()
                        .stroke(Color.red.opacity(0.3), lineWidth: 2)
                        .frame(width: 36, height: 36)
                    
                    Rectangle()
                        .fill(Color.red)
                        .frame(width: 12, height: 12)
                        .cornerRadius(2)
                } else {
                    Circle()
                        .fill(query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && attachedImages.isEmpty ? Color.secondary.opacity(0.3) : Color.accentColor)
                        .frame(width: 36, height: 36)
                    
                    Image(systemName: "arrow.up")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                }
            }
        }
        .buttonStyle(.plain)
        .disabled(query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && attachedImages.isEmpty && !isGenerating)
    }
    
    // MARK: - Chat View
    
    private var chatView: some View {
        VStack(spacing: 0) {
            chatHeader
            
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages) { message in
                            ChatBubbleView(message: message)
                                .id(message.id)
                        }
                        
                        if let pending = pendingUserMessage {
                            ChatBubbleView(message: pending, isPending: true)
                                .id("pending")
                        }
                        
                        if isGenerating && messages.last?.role != .assistant {
                            typingIndicator
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .onChange(of: messages.count) { _, _ in
                    withAnimation {
                        if let lastId = messages.last?.id {
                            proxy.scrollTo(lastId, anchor: .bottom)
                        }
                    }
                }
            }
            
            Divider()
                .padding(.top, 8)
            
            chatInputBar
        }
    }
    
    private var chatHeader: some View {
        HStack {
            Button(action: { viewModel.toggleSidebar() }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
            
            Spacer()
            
            Button(action: { isHistoryOpen.toggle() }) {
                Image(systemName: "clock.arrow.circlepath")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
            
            Button(action: startNewConversation) {
                Image(systemName: "plus.circle")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
            
            Button(action: saveConversation) {
                Image(systemName: "bookmark")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.primary.opacity(0.05))
    }
    
    private var chatInputBar: some View {
        HStack(spacing: 12) {
            Image(systemName: "sparkles")
                .font(.system(size: 16))
                .foregroundColor(.accentColor)
                .frame(width: 32, height: 32)
                .background(Color.accentColor.opacity(0.1))
                .cornerRadius(8)
            
            TextField("Reply...", text: $query, axis: .vertical)
                .textFieldStyle(.plain)
                .font(.system(size: 14))
                .lineLimit(1...6)
                .onChange(of: query) { _, newValue in
                    handleQueryChange(newValue)
                }
                .onSubmit {
                    submitQuery()
                }
            
            Button(action: handleScreenshot) {
                Image(systemName: "camera.fill")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
            
            Button(action: {
                if isGenerating {
                    cancelGeneration()
                } else {
                    submitQuery()
                }
            }) {
                Image(systemName: isGenerating ? "stop.fill" : "arrow.up")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 32, height: 32)
                    .background(isGenerating ? Color.red : Color.accentColor)
                    .cornerRadius(8)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
    }
    
    private var typingIndicator: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(Color.secondary)
                    .frame(width: 8, height: 8)
                    .opacity(0.6)
                    .animation(
                        .easeInOut(duration: 0.6)
                        .repeatForever()
                        .delay(Double(i) * 0.2),
                        value: isGenerating
                    )
            }
            Text("Comet is thinking...")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 8)
    }
    
    // MARK: - Actions
    
    private func handleQueryChange(_ newValue: String) {
        let trimmed = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
        if let lastSlash = trimmed.lastIndex(of: "/") {
            let afterSlash = String(trimmed[trimmed.index(after: lastSlash)...])
            if !afterSlash.contains(" ") {
                commandPrefix = "/" + afterSlash
                showCommandSuggestions = true
                highlightedCommandIndex = 0
            } else {
                showCommandSuggestions = false
            }
        } else {
            showCommandSuggestions = false
        }
    }
    
    private func selectCommand(_ trigger: String) {
        if let lastSlash = query.lastIndex(of: "/") {
            query = String(query[..<lastSlash]) + trigger + " "
        } else {
            query = trigger + " "
        }
        showCommandSuggestions = false
    }
    
    private func submitQuery() {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedQuery.isEmpty || !attachedImages.isEmpty else { return }
        
        let userMessage = ChatMessage(
            id: UUID().uuidString,
            role: .user,
            content: trimmedQuery,
            quotedText: selectedContext,
            imagePaths: attachedImages.compactMap { $0.path },
            timestamp: Date()
        )
        
        messages.append(userMessage)
        pendingUserMessage = userMessage
        query = ""
        selectedContext = nil
        attachedImages = []
        showCommandSuggestions = false
        
        isGenerating = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.pendingUserMessage = nil
            self.isGenerating = false
            let response = ChatMessage(
                id: UUID().uuidString,
                role: .assistant,
                content: "I understand you're asking about: \(trimmedQuery). How can I help you with this?",
                timestamp: Date()
            )
            self.messages.append(response)
        }
    }
    
    private func cancelGeneration() {
        isGenerating = false
        pendingUserMessage = nil
    }
    
    private func startNewConversation() {
        messages = []
        query = ""
        attachedImages = []
        selectedContext = nil
        pendingUserMessage = nil
    }
    
    private func saveConversation() {
        viewModel.saveConversation(messages)
    }
    
    private func handleScreenshot() {
        screenCapturePending = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.screenCapturePending = false
        }
    }
    
    private func removeImage(id: String) {
        attachedImages.removeAll { $0.id == id }
    }
}

// MARK: - Supporting Types

struct CommandItem: Identifiable {
    let id = UUID()
    let trigger: String
    let description: String
}

struct AttachedImageItem: Identifiable {
    let id: String
    let path: String?
    var uiImage: NSImage?
}

struct ChatMessage: Identifiable, Equatable {
    let id: String
    let role: MessageRole
    let content: String
    var quotedText: String? = nil
    var imagePaths: [String] = []
    let timestamp: Date
    
    static func == (lhs: ChatMessage, rhs: ChatMessage) -> Bool {
        lhs.id == rhs.id
    }
}

enum MessageRole {
    case user
    case assistant
}

struct ConversationSummary: Identifiable {
    let id: String
    let title: String
    let updatedAt: Date
}

// MARK: - Chat Bubble View

struct ChatBubbleView: View {
    let message: ChatMessage
    var isPending: Bool = false
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            if message.role == .assistant {
                Image(systemName: "sparkles")
                    .font(.system(size: 14))
                    .foregroundColor(.accentColor)
            } else {
                Spacer(minLength: 40)
            }
            
            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                if let quote = message.quotedText, !quote.isEmpty {
                    Text("\"\(quote)\"")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                        .italic()
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.primary.opacity(0.05))
                        .cornerRadius(4)
                }
                
                if !message.imagePaths.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(message.imagePaths, id: \.self) { path in
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.secondary.opacity(0.3))
                                    .frame(width: 100, height: 100)
                            }
                        }
                    }
                }
                
                Text(message.content)
                    .font(.system(size: 14))
                    .foregroundColor(message.role == .user ? .white : .primary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        message.role == .user ?
                        Color.accentColor :
                        Color.primary.opacity(0.1)
                    )
                    .cornerRadius(12)
            }
            
            if message.role == .user {
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.secondary)
            } else {
                Spacer(minLength: 40)
            }
        }
        .opacity(isPending ? 0.6 : 1.0)
    }
}

// MARK: - Preview

#Preview {
    ThukiV2Panel(viewModel: NativePanelViewModel(configuration: LaunchConfiguration.parse()))
}
