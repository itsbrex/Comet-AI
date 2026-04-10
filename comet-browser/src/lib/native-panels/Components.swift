import SwiftUI
import AppKit

struct PanelPalette {
    let appearance: String
    let gradientPreset: String?

    init(appearance: String, gradientPreset: String? = nil) {
        self.appearance = appearance
        self.gradientPreset = gradientPreset
    }

    var isDark: Bool { appearance != "light" }

    var backgroundGradient: [Color] {
        if let preset = gradientPreset {
            switch preset {
            case "ocean": return isDark ? [Color(hex: "#0f172a"), Color(hex: "#1e293b")] : [Color(hex: "#f0f9ff"), Color(hex: "#e0f2fe")]
            case "graphite": return isDark ? [Color(hex: "#18181b"), Color(hex: "#27272a")] : [Color(hex: "#f8fafc"), Color(hex: "#f1f5f9")]
            case "crystal": return isDark ? [Color(hex: "#1e293b").opacity(0.8), Color(hex: "#0f172a").opacity(0.9)] : [Color(hex: "#f8fafc").opacity(0.7), Color(hex: "#ffffff").opacity(0.8)]
            case "obsidian": return [Color(hex: "#09090b").opacity(0.9), Color(hex: "#121214").opacity(0.95)]
            case "azure": return isDark ? [Color(hex: "#1e3a8a").opacity(0.8), Color(hex: "#1e40af").opacity(0.9)] : [Color(hex: "#eff6ff").opacity(0.7), Color(hex: "#dbeafe").opacity(0.8)]
            case "rose": return isDark ? [Color(hex: "#4c0519").opacity(0.8), Color(hex: "#881337").opacity(0.9)] : [Color(hex: "#fff1f2").opacity(0.7), Color(hex: "#ffe4e6").opacity(0.8)]
            case "liquidGlass": return isDark ? [Color.black.opacity(0.1), Color.white.opacity(0.05)] : [Color.white.opacity(0.1), Color.black.opacity(0.05)]
            default: break
            }
        }
        return isDark ? [Color(hex: "#18181b").opacity(0.92), Color(hex: "#27272a").opacity(0.94)] : [Color(hex: "#f8fafc").opacity(0.8), Color(hex: "#f1f5f9").opacity(0.9)]
    }

    var primaryText: Color { isDark ? .white : Color(hex: "#111827") }
    var secondaryText: Color { isDark ? Color(hex: "#9ca3af") : Color(hex: "#6b7280") }
    var accent: Color { Color(hex: "#6366f1") }
    var secondaryAccent: Color { Color(hex: "#8b5cf6") }
    var mutedSurface: Color { isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.04) }
    var border: Color { isDark ? Color.white.opacity(0.12) : Color.black.opacity(0.08) }
    var buttonText: Color { .white }
}

struct VisualEffectView: NSViewRepresentable {
    let material: NSVisualEffectView.Material
    let blendingMode: NSVisualEffectView.BlendingMode
    
    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = material
        view.blendingMode = blendingMode
        view.state = .active
        return view
    }
    
    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = material
        nsView.blendingMode = blendingMode
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}

struct PanelHeader: View {
    let title: String
    let subtitle: String?
    let symbol: String
    @ObservedObject var viewModel: NativePanelViewModel
    
    var body: some View {
        let palette = PanelPalette(appearance: viewModel.state.themeAppearance)
        HStack(alignment: .center, spacing: 14) {
            ZStack {
                Circle()
                    .fill(palette.accent.opacity(0.2))
                    .frame(width: 44, height: 44)
                
                Image(systemName: symbol)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(palette.accent)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(palette.primaryText)
                
                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 13))
                        .foregroundStyle(palette.secondaryText)
                }
            }
            
            Spacer()
            
            if viewModel.state.isLoading {
                SimpleThinkingIndicator()
            }
        }
    }
}

struct SimpleThinkingIndicator: View {
    @State private var isAnimating = false
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(Color(hex: "#6366f1"))
                    .frame(width: 5, height: 5)
                    .scaleEffect(isAnimating ? 1.0 : 0.5)
                    .opacity(isAnimating ? 1.0 : 0.3)
                    .animation(
                        Animation.easeInOut(duration: 0.6)
                            .repeatForever()
                            .delay(Double(i) * 0.2),
                        value: isAnimating
                    )
            }
        }
        .onAppear { isAnimating = true }
    }
}

struct PanelShell<Content: View>: View {
    let mode: PanelMode
    let viewModel: NativePanelViewModel
    @ViewBuilder let content: Content

    var body: some View {
        let palette = PanelPalette(
            appearance: viewModel.state.themeAppearance,
            gradientPreset: viewModel.state.preferences?.sidebarGradientPreset
        )
        ZStack {
            VisualEffectView(
                material: palette.isDark ? .underWindowBackground : .contentBackground,
                blendingMode: .behindWindow
            )
            .ignoresSafeArea()
            
            LinearGradient(colors: palette.backgroundGradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            
            content
                .safeAreaInset(edge: .top) {
                    Color.clear.frame(height: 38)
                }
        }
        .preferredColorScheme(viewModel.themeColorScheme)
    }
}

struct EmptyStateCard: View {
    let title: String
    let description: String
    let appearance: String

    init(title: String, description: String, appearance: String = "dark") {
        self.title = title
        self.description = description
        self.appearance = appearance
    }

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(palette.primaryText)
            Text(description)
                .font(.system(size: 12, design: .rounded))
                .foregroundStyle(palette.secondaryText)
        }
        .padding(16)
        .background(palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct StatusPill: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.system(size: 9, weight: .black, design: .rounded))
            .foregroundStyle(.white.opacity(0.82))
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(color)
            .clipShape(Capsule())
    }
}

struct PreferenceCard: View {
    let title: String
    let subtitle: String
    let current: String
    let appearance: String
    let onChange: (String) -> Void

    init(title: String, subtitle: String, current: String, appearance: String = "dark", onChange: @escaping (String) -> Void) {
        self.title = title
        self.subtitle = subtitle
        self.current = current
        self.appearance = appearance
        self.onChange = onChange
    }

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(palette.primaryText)
            Text(subtitle)
                .font(.system(size: 11, design: .rounded))
                .foregroundStyle(palette.secondaryText)
            HStack(spacing: 10) {
                ForEach(["electron", "swiftui"], id: \.self) { option in
                    Button(option.capitalized) { onChange(option) }
                        .buttonStyle(.plain)
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundStyle(current == option ? .white : palette.primaryText.opacity(0.78))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(current == option ? palette.accent : palette.mutedSurface)
                        .clipShape(Capsule())
                }
            }
        }
        .padding(16)
        .background(palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct TogglePreferenceCard: View {
    let title: String
    let subtitle: String
    let value: Bool
    let appearance: String
    let onChange: (Bool) -> Void

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        HStack(alignment: .center, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(palette.primaryText)
                Text(subtitle)
                    .font(.system(size: 11, design: .rounded))
                    .foregroundStyle(palette.secondaryText)
            }
            Spacer()
            Toggle("", isOn: Binding(get: { value }, set: { onChange($0) }))
                .toggleStyle(.switch)
                .labelsHidden()
        }
        .padding(16)
        .background(palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct SelectionPreferenceCard: View {
    let title: String
    let subtitle: String
    let current: String
    let options: [(String, String)]
    let appearance: String
    let onChange: (String) -> Void

    var body: some View {
        let palette = PanelPalette(appearance: appearance)
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(palette.primaryText)
            Text(subtitle)
                .font(.system(size: 11, design: .rounded))
                .foregroundStyle(palette.secondaryText)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(options, id: \.0) { option in
                        Button(option.1) { onChange(option.0) }
                            .buttonStyle(.plain)
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundStyle(current == option.0 ? .white : palette.primaryText.opacity(0.78))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(current == option.0 ? palette.accent : palette.mutedSurface)
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .padding(16)
        .background(palette.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct SidebarGlyphButton: View {
    let systemImage: String
    let accessibilityLabel: String
    let appearance: String
    let gradientPreset: String?
    let action: () -> Void

    var body: some View {
        let palette = PanelPalette(appearance: appearance, gradientPreset: gradientPreset)
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(palette.primaryText)
                .frame(width: 34, height: 34)
                .background(palette.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
        .help(accessibilityLabel)
    }
}

struct SidebarTagChip: View {
    let text: String
    let appearance: String
    let gradientPreset: String?

    var body: some View {
        let palette = PanelPalette(appearance: appearance, gradientPreset: gradientPreset)
        Text(text)
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .foregroundStyle(palette.primaryText)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(palette.mutedSurface)
            .clipShape(Capsule())
    }
}

struct SessionChipView: View {
    let title: String
    let updatedAt: Double
    let isActive: Bool
    let appearance: String
    let gradientPreset: String?

    var body: some View {
        let palette = PanelPalette(appearance: appearance, gradientPreset: gradientPreset)
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(isActive ? .white : palette.primaryText)
                .lineLimit(1)
            Text(relativeTimestamp)
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(isActive ? .white.opacity(0.8) : palette.secondaryText)
        }
        .frame(width: 180, alignment: .leading)
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            Group {
                if isActive {
                    LinearGradient(colors: [palette.accent, palette.secondaryAccent], startPoint: .leading, endPoint: .trailing)
                } else {
                    palette.mutedSurface
                }
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var relativeTimestamp: String {
        let date = Date(timeIntervalSince1970: updatedAt / 1000)
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}
