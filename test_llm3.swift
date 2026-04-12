import Foundation
import FoundationModels

@available(macOS 15.0, *)
func testLLM() async {
    let session = LanguageModelSession()
    do {
        let response = try await session.respond(to: "What is 2+2?")
        print(response) // will output structure
        let r2 = response.text // just to cause error to see if text works, nope
    } catch {}
}
