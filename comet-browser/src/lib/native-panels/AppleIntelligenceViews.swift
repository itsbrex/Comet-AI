import SwiftUI

struct AppleIntelligencePanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel
    
    var body: some View {
        PanelShell(mode: .appleIntelligence, viewModel: viewModel) {
            VStack(spacing: 20) {
                PanelHeader(title: "Apple Intelligence", subtitle: "System-wide reasoning and creative tools.", symbol: "apple.intelligence", viewModel: viewModel)
                    .padding(18)
                
                Spacer()
                
                Image(systemName: "apple.intelligence")
                    .font(.system(size: 80))
                    .foregroundStyle(
                        LinearGradient(colors: [.blue, .purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .shadow(radius: 20)
                
                Text("Native Apple Intelligence Integration")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                
                Text("Comet is using macOS system features to summarize, rewrite, and generate content natively.")
                    .font(.system(size: 14, design: .rounded))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                
                Spacer()
            }
        }
    }
}

struct AppleSummaryPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel
    
    var body: some View {
        PanelShell(mode: .appleSummary, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 18) {
                PanelHeader(title: "Smart Summary", subtitle: "Captured from your current screen or browser.", symbol: "text.badge.checkmark", viewModel: viewModel)
                    .padding(18)
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        if viewModel.state.messages.isEmpty {
                            EmptyStateCard(title: "No summary active", description: "Use Apple Intelligence to summarize long articles or documents.", appearance: viewModel.state.themeAppearance)
                        } else if let lastMessage = viewModel.state.messages.last {
                            MessageBubbleView(message: lastMessage, appearance: viewModel.state.themeAppearance, animateContent: true)
                        }
                    }
                    .padding(18)
                }
            }
        }
    }
}

struct AppleImagePanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel
    
    var body: some View {
        PanelShell(mode: .appleImage, viewModel: viewModel) {
            VStack(spacing: 20) {
                PanelHeader(title: "Image Playground", subtitle: "Generative AI for creative visual tasks.", symbol: "wand.and.stars", viewModel: viewModel)
                    .padding(18)
                
                Spacer()
                
                VStack(spacing: 24) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(colors: [.orange, .pink, .purple], startPoint: .top, endPoint: .bottom))
                            .frame(width: 120, height: 120)
                            .shadow(radius: 15)
                        
                        Image(systemName: "photo.stack")
                            .font(.system(size: 44, weight: .bold))
                            .foregroundStyle(.white)
                    }
                    
                    Text("Ready to Generate")
                        .font(.system(size: 20, weight: .black, design: .rounded))
                    
                    Text("Describe what you want to create and Comet will use Apple's native image generators.")
                        .font(.system(size: 13, design: .rounded))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 50)
                }
                
                Spacer()
                
                HStack(spacing: 12) {
                    TextField("Describe your image...", text: $viewModel.promptText)
                        .textFieldStyle(.plain)
                        .padding(14)
                        .background(Color.white.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    
                    Button {
                        viewModel.sendPrompt()
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 28))
                            .foregroundStyle(Color.orange)
                    }
                    .buttonStyle(.plain)
                }
                .padding(18)
            }
        }
    }
}
