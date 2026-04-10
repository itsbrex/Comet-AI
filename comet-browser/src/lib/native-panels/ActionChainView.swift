import SwiftUI

struct ActionChainPanelView: View {
    @ObservedObject var viewModel: NativePanelViewModel

    var body: some View {
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        PanelShell(mode: .actionChain, viewModel: viewModel) {
            VStack(alignment: .leading, spacing: 0) {
                PanelHeader(
                    title: "Action Chain",
                    subtitle: "Comet's multi-step execution plan.",
                    symbol: PanelMode.actionChain.symbol,
                    viewModel: viewModel
                )
                .padding(18)

                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        if viewModel.state.actionChain.isEmpty {
                            EmptyStateCard(title: "No active plan", description: "When you give Comet a complex task, the step-by-step plan will appear here.", appearance: viewModel.state.themeAppearance)
                        }
                        
                        ForEach(Array(viewModel.state.actionChain.enumerated()), id: \.element.id) { index, command in
                            CommandStepRow(
                                index: index,
                                command: command,
                                isCurrent: index == viewModel.state.currentCommandIndex,
                                isPast: index < viewModel.state.currentCommandIndex,
                                appearance: viewModel.state.themeAppearance
                            )
                        }
                    }
                    .padding(18)
                }
            }
        }
    }
}

struct CommandStepRow: View {
    let index: Int
    let command: NativePanelState.Command
    let isCurrent: Bool
    let isPast: Bool
    let appearance: String

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        HStack(alignment: .top, spacing: 14) {
            VStack(spacing: 4) {
                ZStack {
                    Circle()
                        .fill(isPast ? Color.green : (isCurrent ? palette.accent : palette.mutedSurface))
                        .frame(width: 24, height: 24)
                    
                    if isPast {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                    } else {
                        Text("\(index + 1)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(isCurrent ? .white : palette.secondaryText)
                    }
                }
                
                Rectangle()
                    .fill(palette.border)
                    .frame(width: 2, height: 30)
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(command.type.replacingOccurrences(of: "_", with: " "))
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(isCurrent ? palette.primaryText : palette.secondaryText)
                    
                    Spacer()
                    
                    StatusPill(text: command.status.uppercased(), color: colorForStatus)
                }

                Text(command.value)
                    .font(.system(size: 12, design: .rounded))
                    .foregroundStyle(palette.secondaryText)
                    .lineLimit(2)
            }
            .padding(14)
            .background(isCurrent ? palette.accent.opacity(0.12) : palette.mutedSurface.opacity(0.5))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isCurrent ? palette.accent.opacity(0.4) : Color.clear, lineWidth: 1)
            )
        }
    }
    
    private var colorForStatus: Color {
        switch command.status.lowercased() {
        case "completed": return .green.opacity(0.8)
        case "running": return .blue.opacity(0.8)
        case "failed": return .red.opacity(0.8)
        default: return .gray.opacity(0.4)
        }
    }
}
