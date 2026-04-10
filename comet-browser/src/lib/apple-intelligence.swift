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
}

struct ResponsePayload: Codable {
    var success: Bool
    var available: Bool?
    var supportsSummaries: Bool?
    var supportsImageGeneration: Bool?
    var summaryAvailable: Bool?
    var imageAvailable: Bool?
    var summaryReason: String?
    var imageReason: String?
    var osVersion: String?
    var summary: String?
    var imagePath: String?
    var error: String?
}

enum HelperError: Error {
    case invalidRequest(String)
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
@available(macOS 26.0, *)
func summaryAvailabilityStatus() -> (Bool, String?) {
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
}

@available(macOS 26.0, *)
func summarizeWithAppleIntelligence(_ text: String) async throws -> String {
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
}

@available(macOS 26.0, *)
func appleSummaryAvailability() -> Bool {
    summaryAvailabilityStatus().0
}

@available(macOS 26.0, *)
func validateSummaryGeneration() async -> (Bool, String?) {
    let (available, reason) = summaryAvailabilityStatus()
    guard available else {
        return (false, reason)
    }

    do {
        let session = LanguageModelSession(model: .default, instructions: "Reply with exactly: OK")
        let response = try await session.respond(to: "OK")
        let normalized = response.content.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if normalized.contains("ok") {
            return (true, nil)
        }

        return (false, "Apple Intelligence summary generation did not pass the live readiness check on this Mac.")
    } catch {
        return (false, "Apple Intelligence summary generation failed the live readiness check on this Mac.")
    }
}
#endif

#if canImport(ImagePlayground)
@available(macOS 15.4, *)
func imageGenerationStatus() async -> (Bool, String?) {
    let isAvailable = await MainActor.run {
        ImagePlaygroundViewController.isAvailable
    }

    if isAvailable {
        return (true, nil)
    }

    return (false, "Apple image generation is not supported or not available right now on this Mac.")
}

@available(macOS 15.4, *)
func generateAppleImage(prompt: String, outputPath: String?) async throws -> String {
    let creator = try await ImageCreator()
    let images = creator.images(
        for: [.text(prompt)],
        style: .illustration,
        limit: 1
    )

    guard let createdImage = try await images.first(where: { _ in true }) else {
        throw HelperError.invalidRequest("Image Playground did not return an image.")
    }

    let destinationURL: URL
    if let outputPath, !outputPath.isEmpty {
        destinationURL = URL(fileURLWithPath: outputPath)
    } else {
        let picturesDirectory = FileManager.default.urls(for: .picturesDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withDashSeparatorInDate, .withColonSeparatorInTime]
        let filename = "comet-apple-intelligence-\(formatter.string(from: Date()).replacingOccurrences(of: ":", with: "-")).png"
        destinationURL = picturesDirectory.appendingPathComponent(filename)
    }

    try? FileManager.default.removeItem(at: destinationURL)
    try FileManager.default.createDirectory(at: destinationURL.deletingLastPathComponent(), withIntermediateDirectories: true)
    #if canImport(AppKit)
    let bitmap = NSBitmapImageRep(cgImage: createdImage.cgImage)
    guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
        throw HelperError.invalidRequest("Failed to encode the generated Apple image as PNG.")
    }
    try pngData.write(to: destinationURL)
    #else
    throw HelperError.invalidRequest("PNG encoding for Apple image generation is unavailable on this runtime.")
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
                if #available(macOS 15.4, *) {
                    response.supportsImageGeneration = true
                    let (imageAvailable, imageReason) = await imageGenerationStatus()
                    response.imageAvailable = imageAvailable
                    response.imageReason = imageReason
                } else if #available(macOS 15.1, *) {
                    response.supportsImageGeneration = true
                    response.imageAvailable = true // Available via sheet
                    response.imageReason = "Image generation is available via interactive sheet."
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
                        writeResponse(ResponsePayload(success: false, available: false, supportsSummaries: true, supportsImageGeneration: nil, summaryAvailable: false, imageAvailable: nil, summaryReason: summaryReason, imageReason: nil, osVersion: ProcessInfo.processInfo.operatingSystemVersionString, summary: nil, imagePath: nil, error: summaryReason ?? "Apple Intelligence summaries are unavailable on this Mac right now."))
                        return
                    }

                    let summary = try await summarizeWithAppleIntelligence(text)
                    writeResponse(ResponsePayload(success: true, available: true, supportsSummaries: true, supportsImageGeneration: nil, summaryAvailable: true, imageAvailable: nil, summaryReason: nil, imageReason: nil, osVersion: ProcessInfo.processInfo.operatingSystemVersionString, summary: summary, imagePath: nil, error: nil))
                    return
                }
                #endif

                writeResponse(ResponsePayload(success: false, available: false, supportsSummaries: false, supportsImageGeneration: nil, summaryAvailable: false, imageAvailable: nil, summaryReason: "Foundation Models is not available in this macOS SDK/runtime.", imageReason: nil, osVersion: ProcessInfo.processInfo.operatingSystemVersionString, summary: nil, imagePath: nil, error: "Foundation Models is not available in this macOS SDK/runtime."))

            case "image":
                guard let prompt = request.prompt?.trimmingCharacters(in: .whitespacesAndNewlines), !prompt.isEmpty else {
                    throw HelperError.invalidRequest("No prompt provided for Apple image generation.")
                }

                #if canImport(ImagePlayground)
                if #available(macOS 15.4, *) {
                    let (imageAvailable, imageReason) = await imageGenerationStatus()
                    guard imageAvailable else {
                        writeResponse(ResponsePayload(success: false, available: false, supportsSummaries: nil, supportsImageGeneration: true, summaryAvailable: nil, imageAvailable: false, summaryReason: nil, imageReason: imageReason, osVersion: ProcessInfo.processInfo.operatingSystemVersionString, summary: nil, imagePath: nil, error: imageReason ?? "Apple image generation is unavailable on this Mac right now."))
                        return
                    }

                    let path = try await generateAppleImage(prompt: prompt, outputPath: request.outputPath)
                    writeResponse(ResponsePayload(success: true, available: true, supportsSummaries: nil, supportsImageGeneration: true, summaryAvailable: nil, imageAvailable: true, summaryReason: nil, imageReason: nil, osVersion: ProcessInfo.processInfo.operatingSystemVersionString, summary: nil, imagePath: path, error: nil))
                    return
                }
                #endif

                writeResponse(ResponsePayload(success: false, available: false, supportsSummaries: nil, supportsImageGeneration: false, summaryAvailable: nil, imageAvailable: false, summaryReason: nil, imageReason: "Image Playground is not available in this macOS SDK/runtime.", osVersion: ProcessInfo.processInfo.operatingSystemVersionString, summary: nil, imagePath: nil, error: "Image Playground is not available in this macOS SDK/runtime."))

            default:
                throw HelperError.invalidRequest("Unsupported command: \(request.command)")
            }
        } catch {
            writeResponse(ResponsePayload(success: false, available: nil, supportsSummaries: nil, supportsImageGeneration: nil, summaryAvailable: nil, imageAvailable: nil, summaryReason: nil, imageReason: nil, osVersion: ProcessInfo.processInfo.operatingSystemVersionString, summary: nil, imagePath: nil, error: error.localizedDescription))
        }
    }
}
