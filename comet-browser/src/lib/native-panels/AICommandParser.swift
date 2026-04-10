import Foundation

struct CommandInfo: Identifiable {
    let id: String
    let type: String
    let value: String
    let category: String
    let riskLevel: String
    let reason: String?
    let originalMatch: String
    let index: Int

    init(type: String, value: String, category: String, riskLevel: String, reason: String? = nil, originalMatch: String, index: Int) {
        self.type = type
        self.value = value
        self.category = category
        self.riskLevel = riskLevel
        self.reason = reason
        self.originalMatch = originalMatch
        self.index = index
        self.id = "\(type)-\(index)-\(abs(value.hashValue))"
    }
}

struct CommandParseResult {
    let commands: [CommandInfo]
    let textWithoutCommands: String
    let hasCommands: Bool
}

enum AICommandType: String, CaseIterable {
    case NAVIGATE, SEARCH, WEB_SEARCH, READ_PAGE_CONTENT, LIST_OPEN_TABS
    case CREATE_PDF_JSON, CREATE_FILE_JSON, GENERATE_PDF
    case SHELL_COMMAND, SET_THEME, SET_VOLUME, SET_BRIGHTNESS, OPEN_APP
    case SCREENSHOT_AND_ANALYZE, CLICK_ELEMENT, CLICK_AT, FIND_AND_CLICK, FILL_FORM, SCROLL_TO
    case GENERATE_DIAGRAM, GENERATE_FLOWCHART, GENERATE_CHART, OPEN_VIEW, RELOAD, GO_BACK, GO_FORWARD
    case WAIT, THINK, PLAN, EXPLAIN_CAPABILITIES
    case SHOW_IMAGE, SHOW_VIDEO, OCR_COORDINATES, OCR_SCREEN, EXTRACT_DATA
    case DOM_SEARCH, DOM_READ_FILTERED
    case OPEN_MCP_SETTINGS, OPEN_AUTOMATION_SETTINGS, LIST_AUTOMATIONS, DELETE_AUTOMATION
    case OPEN_SCHEDULING_MODAL, SCHEDULE_TASK, OPEN_PDF, PLUGIN_COMMAND
    case ORGANIZE_TABS, CLOSE_TAB, GENERATE_IMAGE

    var category: String {
        switch self {
        case .NAVIGATE, .SEARCH, .WEB_SEARCH: return "navigation"
        case .READ_PAGE_CONTENT, .LIST_OPEN_TABS, .CLOSE_TAB: return "browser"
        case .CLICK_ELEMENT, .CLICK_AT, .FIND_AND_CLICK, .FILL_FORM, .SCROLL_TO, .ORGANIZE_TABS: return "automation"
        case .SHELL_COMMAND, .OPEN_APP, .SET_VOLUME, .SET_BRIGHTNESS: return "system"
        case .CREATE_PDF_JSON, .CREATE_FILE_JSON, .GENERATE_PDF, .GENERATE_DIAGRAM, .GENERATE_FLOWCHART, .GENERATE_CHART, .OPEN_PDF: return "pdf"
        case .SHOW_IMAGE, .SHOW_VIDEO, .SCREENSHOT_AND_ANALYZE, .OCR_COORDINATES, .OCR_SCREEN, .GENERATE_IMAGE: return "media"
        case .WAIT, .OPEN_VIEW, .OPEN_MCP_SETTINGS, .OPEN_AUTOMATION_SETTINGS, .LIST_AUTOMATIONS, .DELETE_AUTOMATION, .OPEN_SCHEDULING_MODAL, .SCHEDULE_TASK, .PLUGIN_COMMAND: return "utility"
        case .THINK, .PLAN, .EXPLAIN_CAPABILITIES: return "meta"
        case .DOM_SEARCH, .DOM_READ_FILTERED, .EXTRACT_DATA: return "browser"
        case .SET_THEME, .RELOAD, .GO_BACK, .GO_FORWARD: return "utility"
        }
    }

    var defaultRisk: String {
        switch category {
        case "navigation", "browser", "meta": return "low"
        default: return "medium"
        }
    }
}

struct AICommandParser {
    private static let jsonCommandPatterns = [
        #"(?s)\{[\s\S]*?"commands"\s*:\s*\[[\s\S]*?\][\s\S]*?\}"#,
        #"(?s)```json\s*\{[\s\S]*?"commands"\s*:\s*\[[\s\S]*?\][\s\S]*?\}\s*```"#,
    ]

    static func parseCommands(from content: String) -> CommandParseResult {
        var commands: [CommandInfo] = []
        var cleanedText = content
        
        // 1. Tag based parsing (Legacy/Native)
        let tagPattern = #"\[\s*([A-Z_]+)\s*(?::\s*([^\]]+?))?\s*\]"#
        if let regex = try? NSRegularExpression(pattern: tagPattern) {
            let nsRange = NSRange(content.startIndex..., in: content)
            let matches = regex.matches(in: content, range: nsRange)
            
            for match in matches.reversed() {
                guard let typeRange = Range(match.range(at: 1), in: content) else { continue }
                let type = String(content[typeRange]).uppercased()
                
                var value = ""
                if match.range(at: 2).location != NSNotFound, let valueRange = Range(match.range(at: 2), in: content) {
                    value = String(content[valueRange]).trimmingCharacters(in: .whitespacesAndNewlines)
                }
                
                if let cmdType = AICommandType(rawValue: type) {
                    commands.append(CommandInfo(
                        type: cmdType.rawValue,
                        value: value,
                        category: cmdType.category,
                        riskLevel: cmdType.defaultRisk,
                        originalMatch: String(content[Range(match.range, in: content)!]),
                        index: match.range.location
                    ))
                    
                    if let range = Range(match.range, in: cleanedText) {
                        cleanedText.removeSubrange(range)
                    }
                }
            }
        }
        
        // 2. JSON parsing
        // (Simplified for Swift - in a real app this would use JSONSerialization)
        
        return CommandParseResult(
            commands: commands.reversed(),
            textWithoutCommands: cleanedText.trimmingCharacters(in: .whitespacesAndNewlines),
            hasCommands: !commands.isEmpty
        )
    }

    static func cleanCustomTags(from text: String) -> String {
        var result = text
        let patterns = [
            #"\[\s*AI REASONING\s*\][\s\S]*?\[\s*/AI REASONING\s*\]"#,
            #"\[\s*OCR_RESULT\s*\][\s\S]*?\[\s*/OCR_RESULT\s*\]"#,
            #"(?is)<(think|thinking|thought)>[\s\S]*?</\1>"#,
        ]
        for pattern in patterns {
            result = result.replacingOccurrences(of: pattern, with: "", options: .regularExpression)
        }
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func extractReasoning(from text: String) -> [String] {
        var results: [String] = []
        let patterns = [
            #"(?is)<(?:think|thinking|thought)>\s*([\s\S]*?)\s*</(?:think|thinking|thought)>"#,
            #"\[\s*AI REASONING\s*\]\s*([\s\S]*?)\s*\[\s*/AI REASONING\s*\]"#
        ]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern) {
                let nsRange = NSRange(text.startIndex..., in: text)
                let matches = regex.matches(in: text, range: nsRange)
                for match in matches {
                    if let range = Range(match.range(at: 1), in: text) {
                        results.append(String(text[range]).trimmingCharacters(in: .whitespacesAndNewlines))
                    }
                }
            }
        }
        return results
    }

    static func extractOCRText(from message: NativePanelState.Message) -> String? {
        if let ocrText = message.ocrText, !ocrText.isEmpty { return ocrText }
        return nil
    }

    static func extractActionLogs(from message: NativePanelState.Message) -> [NativePanelState.ActionLog] {
        return message.actionLogs ?? []
    }

    static func extractMediaItems(from message: NativePanelState.Message) -> [NativePanelState.MediaItem] {
        return message.mediaItems ?? []
    }
}
