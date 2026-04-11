import Foundation
#if canImport(AppKit)
import AppKit
#endif
#if canImport(FoundationModels)
import FoundationModels
#endif
#if canImport(ImagePlayground)
import ImagePlayground
#endif

struct RequestPayload: Codable {
    let command: String
    let text: String?
    let prompt: String?
    let outputPath: String?
    let style: String?
}

struct ResponsePayload: Codable {
    var success: Bool
    var available: Bool?
    var supportsSummaries: Bool?
    var supportsImageGeneration: Bool?
    var supportsGenmoji: Bool?
    var summaryAvailable: Bool?
    var imageAvailable: Bool?
    var genmojiAvailable: Bool?
    var summaryReason: String?
    var imageReason: String?
    var genmojiReason: String?
    var osVersion: String?
    var summary: String?
    var imagePath: String?
    var genmojiPath: String?
    var error: String?
    var availableStyles: [String]?
}

enum HelperError: Error {
    case invalidRequest(String)
    case notSupported(String)
    case creationFailed(String)
}

func readPayload() throws -> RequestPayload {
    let data = FileHandle.standardInput.readDataToEndOfFile()
    guard !data.isEmpty else {
        throw HelperError.invalidRequest("No request payload received.")
    }

    return try JSONDecoder().decode(RequestPayload.self, from: data)
}

func writeResponse(_ payload: ResponsePayload) {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.withoutEscapingSlashes]

    guard let data = try? encoder.encode(payload) else {
        fputs("{\"success\":false,\"error\":\"Failed to encode helper response.\"}\n", stderr)
        return
    }

    FileHandle.standardOutput.write(data)
}

#if canImport(FoundationModels)
@available(macOS 15.1, *)
func summaryAvailabilityStatus() -> (Bool, String?) {
    if #available(macOS 26.0, *) {
        let availability = SystemLanguageModel.default.availability
        switch availability {
        case .available:
            return (true, nil)
        case .unavailable(let reason):
            switch reason {
            case .deviceNotEligible:
                return (false, "Apple Intelligence is not supported on this Mac.")
            case .appleIntelligenceNotEnabled:
                return (false, "Apple Intelligence is supported on this Mac but is currently turned off.")
            case .modelNotReady:
                return (false, "Apple Intelligence is still preparing its local model on this Mac.")
            @unknown default:
                return (false, "Apple Intelligence summaries are unavailable on this Mac right now.")
            }
        @unknown default:
            return (false, "Apple Intelligence summaries are unavailable on this Mac right now.")
        }
    } else {
        return (true, nil)
    }
}

@available(macOS 15.1, *)
func summarizeWithAppleIntelligence(_ text: String) async throws -> String {
    if #available(macOS 26.0, *) {
        let model = SystemLanguageModel.default
        let instructions = """
        You summarize browser content for a productivity assistant.
        Return concise markdown with:
        - a one-line overview
        - 3 to 5 bullets
        - a final short next-step line only when useful
        """

        let session = LanguageModelSession(model: model, instructions: instructions)
        let prompt = """
        Summarize the following content for the user:

        \(text)
        """

        let response = try await session.respond(to: prompt)
        return response.content
    } else {
        throw HelperError.notSupported("Summary requires macOS 26.0 or newer")
    }
}

@available(macOS 15.1, *)
func validateSummaryGeneration() async -> (Bool, String?) {
    let (available, reason) = summaryAvailabilityStatus()
    guard available else {
        return (false, reason)
    }

    if #available(macOS 26.0, *) {
        do {
            let session = LanguageModelSession(model: .default, instructions: "Reply with exactly: OK")
            let response = try await session.respond(to: "OK")
            let normalized = response.content.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            if normalized.contains("ok") {
                return (true, nil)
            }

            return (false, "Apple Intelligence summary generation did not pass the live readiness check on this Mac.")
        } catch {
            return (false, "Apple Intelligence summary generation failed the live readiness check on this Mac: \(error.localizedDescription)")
        }
    } else {
        return (true, nil)
    }
}
#endif

#if canImport(ImagePlayground)
@available(macOS 15.1, *)
func getAvailableImageStyles() async -> [String] {
    if #available(macOS 15.4, *) {
        do {
            let creator = try await ImageCreator()
            return creator.availableStyles.map { style in
                switch style {
                case .animation: return "animation"
                case .illustration: return "illustration"
                case .sketch: return "sketch"
                default: return "illustration"
                }
            }
        } catch {
            return ["illustration"]
        }
    }
    return ["illustration"]
}

@available(macOS 15.1, *)
func imageGenerationStatus() async -> (Bool, String?) {
    if #available(macOS 15.4, *) {
        let isAvailable = await MainActor.run {
            ImagePlaygroundViewController.isAvailable
        }

        if isAvailable {
            return (true, nil)
        }

        return (false, "Apple image generation is not supported or not available right now on this Mac. Please ensure Image Playground models are downloaded.")
    } else {
        return (false, "Image Playground requires macOS 15.1 or newer.")
    }
}

@available(macOS 15.4, *)
func generateAppleImage(prompt: String, outputPath: String?, styleName: String) async throws -> String {
    let creator = try await ImageCreator()
    
    let style: ImagePlaygroundStyle
    switch styleName.lowercased() {
    case "animation":
        style = .animation
    case "sketch":
        style = .sketch
    default:
        style = .illustration
    }
    
    let images = creator.images(
        for: [.text(prompt)],
        style: style,
        limit: 1
    )

    var createdImage: ImageCreator.CreatedImage?
    
    for try await image in images {
        createdImage = image
        break
    }

    guard let finalImage = createdImage else {
        throw HelperError.creationFailed("Image Playground did not return an image.")
    }

    let destinationURL: URL
    if let outputPath, !outputPath.isEmpty {
        destinationURL = URL(fileURLWithPath: outputPath)
    } else {
        let picturesDirectory = FileManager.default.urls(for: .picturesDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withDashSeparatorInDate, .withColonSeparatorInTime]
        let timestamp = formatter.string(from: Date()).replacingOccurrences(of: ":", with: "-")
        let styleSuffix = styleName.isEmpty || styleName == "illustration" ? "" : "-\(styleName)"
        let filename = "comet-ai\(styleSuffix)-\(timestamp).png"
        destinationURL = picturesDirectory.appendingPathComponent(filename)
    }

    try? FileManager.default.removeItem(at: destinationURL)
    try FileManager.default.createDirectory(at: destinationURL.deletingLastPathComponent(), withIntermediateDirectories: true)
    
    #if canImport(AppKit)
    let bitmap = NSBitmapImageRep(cgImage: finalImage.cgImage)
    guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
        throw HelperError.creationFailed("Failed to encode the generated Apple image as PNG.")
    }
    try pngData.write(to: destinationURL)
    #else
    throw HelperError.creationFailed("PNG encoding for Apple image generation is unavailable on this runtime.")
    #endif
    
    return destinationURL.path
}

@available(macOS 15.4, *)
func generateGenmoji(_ prompt: String) async throws -> String {
    let creator = try await ImageCreator()
    
    let genmojiPrompt = "emoji: \(prompt)"
    
    let images = creator.images(
        for: [.text(genmojiPrompt)],
        style: .illustration,
        limit: 1
    )

    var createdImage: ImageCreator.CreatedImage?
    
    for try await image in images {
        createdImage = image
        break
    }

    guard let finalImage = createdImage else {
        throw HelperError.creationFailed("Genmoji generation did not return an image.")
    }

    let emojiDirectory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first?
        .appendingPathComponent("Comet-AI/Genmoji", isDirectory: true)
        ?? URL(fileURLWithPath: NSTemporaryDirectory())
    
    try FileManager.default.createDirectory(at: emojiDirectory, withIntermediateDirectories: true)
    
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd_HH-mm-ss"
    let timestamp = formatter.string(from: Date())
    let sanitizedPrompt = prompt.replacingOccurrences(of: "[^a-zA-Z0-9]", with: "_", options: .regularExpression).prefix(20)
    let filename = "genmoji_\(sanitizedPrompt)_\(timestamp).png"
    let destinationURL = emojiDirectory.appendingPathComponent(filename)

    try? FileManager.default.removeItem(at: destinationURL)
    
    #if canImport(AppKit)
    let bitmap = NSBitmapImageRep(cgImage: finalImage.cgImage)
    guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
        throw HelperError.creationFailed("Failed to encode the generated Genmoji as PNG.")
    }
    try pngData.write(to: destinationURL)
    #else
    throw HelperError.creationFailed("PNG encoding for Genmoji generation is unavailable on this runtime.")
    #endif
    
    return destinationURL.path
}
#endif

@main
struct AppleIntelligenceHelper {
    static func main() async {
        do {
            let request = try readPayload()

            switch request.command {
            case "status":
                var response = ResponsePayload(success: true, osVersion: ProcessInfo.processInfo.operatingSystemVersionString)
                
                #if canImport(FoundationModels)
                if #available(macOS 15.1, *) {
                    let (summaryAvailable, summaryReason) = await validateSummaryGeneration()
                    response.available = summaryAvailable
                    response.supportsSummaries = true
                    response.summaryAvailable = summaryAvailable
                    response.summaryReason = summaryReason
                } else {
                    response.available = false
                    response.supportsSummaries = false
                    response.summaryAvailable = false
                    response.summaryReason = "Foundation Models requires macOS 15.1 or newer."
                }
                #else
                response.available = false
                response.supportsSummaries = false
                response.summaryAvailable = false
                response.summaryReason = "Foundation Models is not available in this build."
                #endif

                #if canImport(ImagePlayground)
                if #available(macOS 15.1, *) {
                    response.availableStyles = await getAvailableImageStyles()
                    
                    if #available(macOS 15.4, *) {
                        response.supportsGenmoji = true
                        response.genmojiAvailable = true
                        response.genmojiReason = nil
                        
                        let (imageAvailable, imageReason) = await imageGenerationStatus()
                        response.supportsImageGeneration = true
                        response.imageAvailable = imageAvailable
                        response.imageReason = imageReason
                    } else {
                        response.supportsImageGeneration = true
                        response.imageAvailable = true
                        response.imageReason = "Image generation is available via interactive sheet (macOS 15.1-15.3)."
                        response.supportsGenmoji = false
                        response.genmojiAvailable = false
                        response.genmojiReason = "Genmoji requires macOS 15.4 or newer."
                    }
                } else {
                    response.supportsImageGeneration = false
                    response.imageAvailable = false
                    response.imageReason = "Image Playground requires macOS 15.1 or newer."
                }
                #else
                response.supportsImageGeneration = false
                response.imageAvailable = false
                response.imageReason = "Image Playground is not available in this build."
                #endif

                writeResponse(response)

            case "summary":
                guard let text = request.text?.trimmingCharacters(in: .whitespacesAndNewlines), !text.isEmpty else {
                    throw HelperError.invalidRequest("No text provided for Apple Intelligence summary.")
                }

                #if canImport(FoundationModels)
                if #available(macOS 15.1, *) {
                    let (summaryAvailable, summaryReason) = summaryAvailabilityStatus()
                    guard summaryAvailable else {
                        writeResponse(ResponsePayload(
                            success: false,
                            available: false,
                            supportsSummaries: true,
                            supportsImageGeneration: nil,
                            supportsGenmoji: nil,
                            summaryAvailable: false,
                            imageAvailable: nil,
                            genmojiAvailable: nil,
                            summaryReason: summaryReason,
                            imageReason: nil,
                            genmojiReason: nil,
                            osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                            summary: nil,
                            imagePath: nil,
                            genmojiPath: nil,
                            error: summaryReason ?? "Apple Intelligence summaries are unavailable on this Mac right now."
                        ))
                        return
                    }

                    let summary = try await summarizeWithAppleIntelligence(text)
                    writeResponse(ResponsePayload(
                        success: true,
                        available: true,
                        supportsSummaries: true,
                        supportsImageGeneration: nil,
                        supportsGenmoji: nil,
                        summaryAvailable: true,
                        imageAvailable: nil,
                        genmojiAvailable: nil,
                        summaryReason: nil,
                        imageReason: nil,
                        genmojiReason: nil,
                        osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                        summary: summary,
                        imagePath: nil,
                        genmojiPath: nil,
                        error: nil
                    ))
                    return
                }
                #endif

                writeResponse(ResponsePayload(
                    success: false,
                    available: false,
                    supportsSummaries: false,
                    supportsImageGeneration: nil,
                    supportsGenmoji: nil,
                    summaryAvailable: false,
                    imageAvailable: nil,
                    genmojiAvailable: nil,
                    summaryReason: "Foundation Models is not available in this macOS SDK/runtime.",
                    imageReason: nil,
                    genmojiReason: nil,
                    osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                    summary: nil,
                    imagePath: nil,
                    genmojiPath: nil,
                    error: "Foundation Models is not available in this macOS SDK/runtime."
                ))

            case "image":
                guard let prompt = request.prompt?.trimmingCharacters(in: .whitespacesAndNewlines), !prompt.isEmpty else {
                    throw HelperError.invalidRequest("No prompt provided for Apple image generation.")
                }

                let style = request.style ?? "illustration"

                #if canImport(ImagePlayground)
                if #available(macOS 15.4, *) {
                    let (imageAvailable, imageReason) = await imageGenerationStatus()
                    guard imageAvailable else {
                        writeResponse(ResponsePayload(
                            success: false,
                            available: false,
                            supportsSummaries: nil,
                            supportsImageGeneration: true,
                            supportsGenmoji: true,
                            summaryAvailable: nil,
                            imageAvailable: false,
                            genmojiAvailable: nil,
                            summaryReason: nil,
                            imageReason: imageReason,
                            genmojiReason: nil,
                            osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                            summary: nil,
                            imagePath: nil,
                            genmojiPath: nil,
                            error: imageReason ?? "Apple image generation is unavailable on this Mac right now."
                        ))
                        return
                    }

                    do {
                        let path = try await generateAppleImage(prompt: prompt, outputPath: request.outputPath, styleName: style)
                        writeResponse(ResponsePayload(
                            success: true,
                            available: true,
                            supportsSummaries: nil,
                            supportsImageGeneration: true,
                            supportsGenmoji: true,
                            summaryAvailable: nil,
                            imageAvailable: true,
                            genmojiAvailable: nil,
                            summaryReason: nil,
                            imageReason: nil,
                            genmojiReason: nil,
                            osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                            summary: nil,
                            imagePath: path,
                            genmojiPath: nil,
                            error: nil
                        ))
                        return
                    } catch {
                        writeResponse(ResponsePayload(
                            success: false,
                            available: false,
                            supportsSummaries: nil,
                            supportsImageGeneration: true,
                            supportsGenmoji: true,
                            summaryAvailable: nil,
                            imageAvailable: false,
                            genmojiAvailable: nil,
                            summaryReason: nil,
                            imageReason: error.localizedDescription,
                            genmojiReason: nil,
                            osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                            summary: nil,
                            imagePath: nil,
                            genmojiPath: nil,
                            error: "Image generation failed: \(error.localizedDescription)"
                        ))
                        return
                    }
                }
                #endif

                writeResponse(ResponsePayload(
                    success: false,
                    available: false,
                    supportsSummaries: nil,
                    supportsImageGeneration: false,
                    supportsGenmoji: nil,
                    summaryAvailable: nil,
                    imageAvailable: false,
                    genmojiAvailable: nil,
                    summaryReason: nil,
                    imageReason: "Image Playground is not available in this macOS SDK/runtime.",
                    genmojiReason: nil,
                    osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                    summary: nil,
                    imagePath: nil,
                    genmojiPath: nil,
                    error: "Image Playground is not available in this macOS SDK/runtime."
                ))
                
            case "genmoji":
                guard let prompt = request.prompt?.trimmingCharacters(in: .whitespacesAndNewlines), !prompt.isEmpty else {
                    throw HelperError.invalidRequest("No prompt provided for Genmoji generation.")
                }

                #if canImport(ImagePlayground)
                if #available(macOS 15.4, *) {
                    do {
                        let path = try await generateGenmoji(prompt)
                        writeResponse(ResponsePayload(
                            success: true,
                            available: true,
                            supportsSummaries: nil,
                            supportsImageGeneration: true,
                            supportsGenmoji: true,
                            summaryAvailable: nil,
                            imageAvailable: nil,
                            genmojiAvailable: true,
                            summaryReason: nil,
                            imageReason: nil,
                            genmojiReason: nil,
                            osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                            summary: nil,
                            imagePath: nil,
                            genmojiPath: path,
                            error: nil
                        ))
                        return
                    } catch {
                        writeResponse(ResponsePayload(
                            success: false,
                            available: false,
                            supportsSummaries: nil,
                            supportsImageGeneration: true,
                            supportsGenmoji: true,
                            summaryAvailable: nil,
                            imageAvailable: nil,
                            genmojiAvailable: false,
                            summaryReason: nil,
                            imageReason: nil,
                            genmojiReason: error.localizedDescription,
                            osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                            summary: nil,
                            imagePath: nil,
                            genmojiPath: nil,
                            error: "Genmoji generation failed: \(error.localizedDescription)"
                        ))
                        return
                    }
                }
                #endif
                
                writeResponse(ResponsePayload(
                    success: false,
                    available: false,
                    supportsSummaries: nil,
                    supportsImageGeneration: nil,
                    supportsGenmoji: false,
                    summaryAvailable: nil,
                    imageAvailable: nil,
                    genmojiAvailable: false,
                    summaryReason: nil,
                    imageReason: nil,
                    genmojiReason: "Genmoji requires macOS 15.4 or newer.",
                    osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                    summary: nil,
                    imagePath: nil,
                    genmojiPath: nil,
                    error: "Genmoji requires macOS 15.4 or newer."
                ))

            default:
                throw HelperError.invalidRequest("Unsupported command: \(request.command)")
            }
        } catch {
            writeResponse(ResponsePayload(
                success: false,
                available: nil,
                supportsSummaries: nil,
                supportsImageGeneration: nil,
                supportsGenmoji: nil,
                summaryAvailable: nil,
                imageAvailable: nil,
                genmojiAvailable: nil,
                summaryReason: nil,
                imageReason: nil,
                genmojiReason: nil,
                osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                summary: nil,
                imagePath: nil,
                genmojiPath: nil,
                error: error.localizedDescription
            ))
        }
    }
}