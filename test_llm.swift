import Foundation
import FoundationModels

@available(macOS 15.0, *)
func testLLM() async {
    let session = LanguageModelSession(instructions: "You are a helpful assistant")
    do {
        let response = try await session.respond(to: "What is 2+2?")
        print(response.text)
    } catch {}
}
