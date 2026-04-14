//
//  CometSidebar.swift
//  comet-ai-sidebar
//
//  Native macOS AI Sidebar powered by SwiftUI
//  Inspired by Thuki (Apache 2.0) by Logan Nguyen
//
//  v0.2.9.1 - Comet-AI Browser
//

import Foundation
import AppKit
import SwiftUI
import Combine

@objc public class CometSidebarController: NSObject {
    
    @objc public static let shared = CometSidebarController()
    
    private var window: NSWindow?
    private var viewModel: SidebarViewModel?
    private var cancellables = Set<AnyCancellable>()
    
    // LLM Provider Configuration from Electron
    @objc public var llmEndpoint: String = "http://127.0.0.1:11434"
    @objc public var llmModel: String = "gemma4:e2b"
    @objc public var llmApiKey: String = ""
    @objc public var providerType: String = "ollama" // ollama, openai, anthropic, gemini
    
    private override init() {
        super.init()
        setupNotifications()
    }
    
    // MARK: - Public API
    
    @objc public func configureLLM(endpoint: String, model: String, apiKey: String, provider: String) {
        self.llmEndpoint = endpoint
        self.llmModel = model
        self.llmApiKey = apiKey
        self.providerType = provider
        UserDefaults.standard.set(endpoint, forKey: "comet_llm_endpoint")
        UserDefaults.standard.set(model, forKey: "comet_llm_model")
        UserDefaults.standard.set(provider, forKey: "comet_llm_provider")
        if !apiKey.isEmpty {
            KeychainHelper.save(apiKey, for: "comet_llm_apikey")
        }
    }
    
    @objc public func loadLLMConfig() {
        self.llmEndpoint = UserDefaults.standard.string(forKey: "comet_llm_endpoint") ?? "http://127.0.0.1:11434"
        self.llmModel = UserDefaults.standard.string(forKey: "comet_llm_model") ?? "gemma4:e2b"
        self.providerType = UserDefaults.standard.string(forKey: "comet_llm_provider") ?? "ollama"
        if let apiKey = KeychainHelper.load(for: "comet_llm_apikey") {
            self.llmApiKey = apiKey
        }
    }
    
    @objc public func showWindow() {
        DispatchQueue.main.async {
            self.createWindowIfNeeded()
            self.window?.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }
    }
    
    @objc public func hideWindow() {
        window?.orderOut(nil)
    }
    
    @objc public func toggleWindow() {
        if window?.isVisible == true {
            hideWindow()
        } else {
            showWindow()
        }
    }
    
    @objc public func setSidebarVersion(_ version: String) {
        UserDefaults.standard.set(version, forKey: "comet_sidebar_version")
    }
    
    @objc public func getSidebarVersion() -> String {
        return UserDefaults.standard.string(forKey: "comet_sidebar_version") ?? "electron"
    }
    
    @objc public func setAutoStart(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: "comet_sidebar_autostart")
    }
    
    @objc public func getAutoStart() -> Bool {
        return UserDefaults.standard.bool(forKey: "comet_sidebar_autostart")
    }
    
    // MARK: - Private Methods
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleKeyDown(_:)),
            name: NSNotification.Name("CometKeyDown"),
            object: nil
        )
    }
    
    @objc private func handleKeyDown(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let key = userInfo["key"] as? String else { return }
        
        if key == "Escape" || (userInfo["meta"] as? Bool == true && key == "w") {
            hideWindow()
        }
    }
    
    private func createWindowIfNeeded() {
        guard window == nil else { return }
        
        loadLLMConfig()
        
        let contentView = NSHostingView(
            rootView: SidebarContentView(
                viewModel: SidebarViewModel(
                    llmEndpoint: llmEndpoint,
                    llmModel: llmModel,
                    llmApiKey: llmApiKey,
                    providerType: providerType
                )
            )
        )
        
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 430, height: 600),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        
        window?.title = "Comet AI"
        window?.titleVisibility = .hidden
        window?.titlebarAppearsTransparent = true
        window?.backgroundColor = .clear
        window?.isOpaque = false
        window?.hasShadow = true
        window?.level = .floating
        window?.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        window?.contentView = contentView
        window?.isMovableByWindowBackground = true
        
        // Center on right side of screen
        if let screen = NSScreen.main {
            let screenFrame = screen.visibleFrame
            let x = screenFrame.maxX - 460
            let y = screenFrame.maxY - 640
            window?.setFrameOrigin(NSPoint(x: x, y: y))
        }
        
        window?.minSize = NSSize(width: 360, height: 400)
        window?.maxSize = NSSize(width: 600, height: 900)
    }
}

// MARK: - SidebarViewModel

@objc public class SidebarViewModel: NSObject, ObservableObject {
    
    @Published var query: String = ""
    @Published var messages: [Message] = []
    @Published var isGenerating: Bool = false
    @Published var isHistoryOpen: Bool = false
    @Published var selectedContext: String?
    @Published var attachedImages: [AttachedImage] = []
    @Published var showCommandSuggestions: Bool = false
    @Published var commandPrefix: String = ""
    @Published var highlightedIndex: Int = 0
    @Published var captureError: String?
    
    let llmEndpoint: String
    let llmModel: String
    let llmApiKey: String
    let providerType: String
    
    private var conversationHistory: [Conversation] = []
    private var currentConversationId: String?
    
    let commands: [SidebarCommand] = [
        SidebarCommand(trigger: "/screen", description: "Capture screen and attach", icon: "camera"),
        SidebarCommand(trigger: "/think", description: "Enable thinking mode", icon: "brain"),
        SidebarCommand(trigger: "/search", description: "Search the web", icon: "magnifyingglass"),
        SidebarCommand(trigger: "/summarize", description: "Summarize content", icon: "doc.text"),
        SidebarCommand(trigger: "/translate", description: "Translate text", icon: "globe"),
        SidebarCommand(trigger: "/explain", description: "Explain code/concept", icon: "questionmark.circle"),
        SidebarCommand(trigger: "/rewrite", description: "Rewrite selected text", icon: "pencil")
    ]
    
    var filteredCommands: [SidebarCommand] {
        guard !commandPrefix.isEmpty else { return [] }
        return commands.filter { $0.trigger.lowercased().hasPrefix(commandPrefix.lowercased()) }
    }
    
    var isChatMode: Bool {
        !messages.isEmpty || isGenerating
    }
    
    init(llmEndpoint: String, llmModel: String, llmApiKey: String, providerType: String) {
        self.llmEndpoint = llmEndpoint
        self.llmModel = llmModel
        self.llmApiKey = llmApiKey
        self.providerType = providerType
        super.init()
        loadHistory()
    }
    
    func handleQueryChange(_ text: String) {
        query = text
        let words = text.trimmingCharacters(in: .whitespacesAndNewlines).split(separator: " ")
        if let lastWord = words.last, lastWord.hasPrefix("/") {
            commandPrefix = String(lastWord)
            showCommandSuggestions = true
            highlightedIndex = 0
        } else {
            showCommandSuggestions = false
            commandPrefix = ""
        }
    }
    
    func selectCommand(_ trigger: String) {
        let words = query.split(separator: " ")
        if let lastIndex = words.indices.last, words[lastIndex].hasPrefix("/") {
            query = words.dropLast().joined(separator: " ") + " " + trigger + " "
        } else {
            query = trigger + " "
        }
        showCommandSuggestions = false
        commandPrefix = ""
    }
    
    func submitQuery() {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty || !attachedImages.isEmpty else { return }
        
        let userMessage = Message(
            id: UUID().uuidString,
            role: .user,
            content: trimmed,
            quotedText: selectedContext,
            timestamp: Date()
        )
        messages.append(userMessage)
        
        let contextBackup = selectedContext
        query = ""
        selectedContext = nil
        attachedImages = []
        showCommandSuggestions = false
        isGenerating = true
        
        // Send to LLM
        sendToLLM(messages: messages) { [weak self] response in
            DispatchQueue.main.async {
                self?.isGenerating = false
                let assistantMessage = Message(
                    id: UUID().uuidString,
                    role: .assistant,
                    content: response,
                    timestamp: Date()
                )
                self?.messages.append(assistantMessage)
                self?.saveHistory()
            }
        }
    }
    
    func sendToLLM(messages: [Message], completion: @escaping (String) -> Void) {
        var prompt = messages.map { "\($0.role == .user ? "User" : "Assistant"): \($0.content)" }.joined(separator: "\n")
        prompt += "\nAssistant:"
        
        switch providerType {
        case "ollama":
            sendToOllama(prompt: prompt, completion: completion)
        case "openai":
            sendToOpenAI(prompt: prompt, completion: completion)
        case "anthropic":
            sendToAnthropic(prompt: prompt, completion: completion)
        case "gemini":
            sendToGemini(prompt: prompt, completion: completion)
        default:
            sendToOllama(prompt: prompt, completion: completion)
        }
    }
    
    private func sendToOllama(prompt: String, completion: @escaping (String) -> Void) {
        guard let url = URL(string: "\(llmEndpoint)/api/generate") else {
            completion("Error: Invalid Ollama endpoint")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "model": llmModel,
            "prompt": prompt,
            "stream": false
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion("Error: \(error.localizedDescription)")
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let responseText = json["response"] as? String else {
                completion("Error: Failed to parse Ollama response")
                return
            }
            
            completion(responseText)
        }.resume()
    }
    
    private func sendToOpenAI(prompt: String, completion: @escaping (String) -> Void) {
        guard let url = URL(string: "\(llmEndpoint)/chat/completions") else {
            completion("Error: Invalid OpenAI endpoint")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(llmApiKey)", forHTTPHeaderField: "Authorization")
        
        let body: [String: Any] = [
            "model": llmModel,
            "messages": [["role": "user", "content": prompt]],
            "max_tokens": 2000
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion("Error: \(error.localizedDescription)")
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let choices = json["choices"] as? [[String: Any]],
                  let firstChoice = choices.first,
                  let message = firstChoice["message"] as? [String: Any],
                  let content = message["content"] as? String else {
                completion("Error: Failed to parse OpenAI response")
                return
            }
            
            completion(content)
        }.resume()
    }
    
    private func sendToAnthropic(prompt: String, completion: @escaping (String) -> Void) {
        guard let url = URL(string: "\(llmEndpoint)/messages") else {
            completion("Error: Invalid Anthropic endpoint")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(llmApiKey)", forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        
        let body: [String: Any] = [
            "model": llmModel,
            "messages": [["role": "user", "content": prompt]],
            "max_tokens": 2000
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion("Error: \(error.localizedDescription)")
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let content = json["content"] as? [[String: Any]],
                  let firstBlock = content.first,
                  let text = firstBlock["text"] as? String else {
                completion("Error: Failed to parse Anthropic response")
                return
            }
            
            completion(text)
        }.resume()
    }
    
    private func sendToGemini(prompt: String, completion: @escaping (String) -> Void) {
        guard let url = URL(string: "\(llmEndpoint)/v1beta/models/\(llmModel):generateContent?key=\(llmApiKey)") else {
            completion("Error: Invalid Gemini endpoint")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "contents": [["parts": [["text": prompt]]]],
            "generationConfig": ["maxOutputTokens": 2000]
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion("Error: \(error.localizedDescription)")
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let candidates = json["candidates"] as? [[String: Any]],
                  let firstCandidate = candidates.first,
                  let content = firstCandidate["content"] as? [String: Any],
                  let parts = content["parts"] as? [[String: Any]],
                  let firstPart = parts.first,
                  let text = firstPart["text"] as? String else {
                completion("Error: Failed to parse Gemini response")
                return
            }
            
            completion(text)
        }.resume()
    }
    
    func cancelGeneration() {
        isGenerating = false
    }
    
    func startNewConversation() {
        if !messages.isEmpty {
            saveCurrentConversation()
        }
        messages = []
        query = ""
        attachedImages = []
        selectedContext = nil
    }
    
    func saveCurrentConversation() {
        guard !messages.isEmpty else { return }
        let conversation = Conversation(
            id: currentConversationId ?? UUID().uuidString,
            title: messages.first?.content.prefix(50).description ?? "New Chat",
            messages: messages,
            updatedAt: Date()
        )
        
        if let existingIndex = conversationHistory.firstIndex(where: { $0.id == conversation.id }) {
            conversationHistory[existingIndex] = conversation
        } else {
            conversationHistory.insert(conversation, at: 0)
        }
        
        if conversationHistory.count > 50 {
            conversationHistory = Array(conversationHistory.prefix(50))
        }
        
        saveHistory()
    }
    
    func loadHistory() {
        if let data = UserDefaults.standard.data(forKey: "comet_conversation_history"),
           let history = try? JSONDecoder().decode([Conversation].self, from: data) {
            conversationHistory = history
        }
    }
    
    func saveHistory() {
        if let data = try? JSONEncoder().encode(conversationHistory) {
            UserDefaults.standard.set(data, forKey: "comet_conversation_history")
        }
    }
    
    func handleScreenshot() {
        // Screenshot capture would be implemented here
        // Using CGWindowListCreateImage for screen capture
    }
    
    func addAttachedImage(_ image: NSImage) {
        let attached = AttachedImage(
            id: UUID().uuidString,
            image: image
        )
        attachedImages.append(attached)
    }
    
    func removeAttachedImage(_ id: String) {
        attachedImages.removeAll { $0.id == id }
    }
}

// MARK: - Models

struct Message: Identifiable, Codable {
    let id: String
    let role: MessageRole
    let content: String
    var quotedText: String?
    let timestamp: Date
    
    enum MessageRole: String, Codable {
        case user
        case assistant
    }
}

struct Conversation: Identifiable, Codable {
    let id: String
    let title: String
    let messages: [Message]
    let updatedAt: Date
}

struct SidebarCommand {
    let trigger: String
    let description: String
    let icon: String
}

struct AttachedImage: Identifiable {
    let id: String
    let image: NSImage
}

// MARK: - KeychainHelper

class KeychainHelper {
    static func save(_ value: String, for key: String) {
        let data = value.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    static func load(for key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return value
    }
    
    static func delete(for key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - SidebarContentView

struct SidebarContentView: View {
    @ObservedObject var viewModel: SidebarViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            if viewModel.isChatMode {
                ChatView(viewModel: viewModel)
            } else {
                AskBarView(viewModel: viewModel)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(NSColor.windowBackgroundColor))
    }
}

struct AskBarView: View {
    @ObservedObject var viewModel: SidebarViewModel
    @State private var inputHeight: CGFloat = 44
    
    var body: some View {
        VStack {
            Spacer()
            
            VStack(spacing: 12) {
                // Quoted text
                if let context = viewModel.selectedContext {
                    Text("\"\(context.prefix(200))\"")
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
                
                // Attached images
                if !viewModel.attachedImages.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(viewModel.attachedImages) { img in
                                ZStack(alignment: .topTrailing) {
                                    Image(nsImage: img.image)
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                        .frame(width: 56, height: 56)
                                        .cornerRadius(8)
                                    
                                    Button(action: { viewModel.removeAttachedImage(img.id) }) {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(.white)
                                    }
                                    .offset(x: 4, y: -4)
                                }
                            }
                        }
                        .padding(.horizontal, 12)
                    }
                }
                
                // Command suggestions
                if viewModel.showCommandSuggestions && !viewModel.filteredCommands.isEmpty {
                    VStack(spacing: 0) {
                        ForEach(Array(viewModel.filteredCommands.enumerated()), id: \.element.trigger) { index, cmd in
                            Button(action: { viewModel.selectCommand(cmd.trigger) }) {
                                HStack {
                                    Image(systemName: cmd.icon)
                                        .frame(width: 20)
                                    Text(cmd.trigger)
                                        .font(.system(size: 13, design: .monospaced))
                                    Text(cmd.description)
                                        .font(.system(size: 12))
                                        .foregroundColor(.secondary)
                                    Spacer()
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(index == viewModel.highlightedIndex ? Color.accentColor.opacity(0.2) : Color.clear)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .background(Color.primary.opacity(0.05))
                    .cornerRadius(8)
                    .padding(.horizontal, 12)
                }
                
                // Input bar
                HStack(spacing: 12) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 18))
                        .foregroundColor(.accentColor)
                        .frame(width: 40, height: 40)
                        .background(Color.accentColor.opacity(0.1))
                        .cornerRadius(10)
                    
                    if !viewModel.isHistoryOpen {
                        Button(action: { viewModel.isHistoryOpen = true }) {
                            Image(systemName: "clock.arrow.circlepath")
                                .font(.system(size: 14))
                                .foregroundColor(.secondary)
                        }
                        .buttonStyle(.plain)
                    }
                    
                    TextField("Ask Comet anything...", text: Binding(
                        get: { viewModel.query },
                        set: { viewModel.handleQueryChange($0) }
                    ), axis: .vertical)
                    .textFieldStyle(.plain)
                    .font(.system(size: 14))
                    .lineLimit(1...6)
                    .onSubmit { viewModel.submitQuery() }
                    
                    Button(action: viewModel.handleScreenshot) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                    
                    Button(action: viewModel.submitQuery) {
                        ZStack {
                            if viewModel.isGenerating {
                                Circle()
                                    .stroke(Color.red.opacity(0.3), lineWidth: 2)
                                    .frame(width: 36, height: 36)
                                Rectangle()
                                    .fill(Color.red)
                                    .frame(width: 12, height: 12)
                                    .cornerRadius(2)
                            } else {
                                Circle()
                                    .fill(viewModel.query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && viewModel.attachedImages.isEmpty ? Color.secondary.opacity(0.3) : Color.accentColor)
                                    .frame(width: 36, height: 36)
                                Image(systemName: "arrow.up")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                    .disabled(viewModel.query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && viewModel.attachedImages.isEmpty && !viewModel.isGenerating)
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
            .padding(.horizontal, 16)
            .padding(.bottom, 20)
        }
    }
}

struct ChatView: View {
    @ObservedObject var viewModel: SidebarViewModel
    @State private var scrollProxy: ScrollViewProxy?
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: { 
                    viewModel.startNewConversation()
                }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
                
                Spacer()
                
                Button(action: { viewModel.isHistoryOpen.toggle() }) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
                
                Button(action: { viewModel.startNewConversation() }) {
                    Image(systemName: "plus.circle")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
                
                Button(action: { viewModel.saveCurrentConversation() }) {
                    Image(systemName: "bookmark")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.primary.opacity(0.05))
            
            // Messages
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.messages) { message in
                            MessageBubble(message: message)
                                .id(message.id)
                        }
                        
                        if viewModel.isGenerating && viewModel.messages.last?.role != .assistant {
                            TypingIndicator()
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .onChange(of: viewModel.messages.count) { _, _ in
                    if let lastId = viewModel.messages.last?.id {
                        withAnimation {
                            proxy.scrollTo(lastId, anchor: .bottom)
                        }
                    }
                }
            }
            
            Divider()
                .padding(.top, 8)
            
            // Input
            ChatInputBar(viewModel: viewModel)
        }
    }
}

struct MessageBubble: View {
    let message: Message
    
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
                if let quote = message.quotedText {
                    Text("\"\(quote)\"")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                        .italic()
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.primary.opacity(0.05))
                        .cornerRadius(4)
                }
                
                Text(message.content)
                    .font(.system(size: 14))
                    .foregroundColor(message.role == .user ? .white : .primary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        message.role == .user ? Color.accentColor : Color.primary.opacity(0.1)
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
    }
}

struct TypingIndicator: View {
    @State private var opacity: Double = 0.4
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(Color.secondary)
                    .frame(width: 8, height: 8)
                    .opacity(opacity)
                    .animation(
                        .easeInOut(duration: 0.6)
                        .repeatForever()
                        .delay(Double(i) * 0.2),
                        value: opacity
                    )
            }
            Text("Comet is thinking...")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 8)
        .onAppear { opacity = 1.0 }
    }
}

struct ChatInputBar: View {
    @ObservedObject var viewModel: SidebarViewModel
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "sparkles")
                .font(.system(size: 16))
                .foregroundColor(.accentColor)
                .frame(width: 32, height: 32)
                .background(Color.accentColor.opacity(0.1))
                .cornerRadius(8)
            
            TextField("Reply...", text: Binding(
                get: { viewModel.query },
                set: { viewModel.handleQueryChange($0) }
            ), axis: .vertical)
            .textFieldStyle(.plain)
            .font(.system(size: 14))
            .lineLimit(1...6)
            .onSubmit { viewModel.submitQuery() }
            
            Button(action: viewModel.handleScreenshot) {
                Image(systemName: "camera.fill")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
            
            Button(action: viewModel.isGenerating ? viewModel.cancelGeneration : viewModel.submitQuery) {
                Image(systemName: viewModel.isGenerating ? "stop.fill" : "arrow.up")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 32, height: 32)
                    .background(viewModel.isGenerating ? Color.red : Color.accentColor)
                    .cornerRadius(8)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
    }
}
