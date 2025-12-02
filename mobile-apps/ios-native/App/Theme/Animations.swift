import SwiftUI

// MARK: - Modern Animation Library for iOS 17+
// Comprehensive animation system with spring animations, matched geometry effects,
// phase animators, and keyframe animations

// MARK: - Animation Presets
struct FleetAnimations {

    // MARK: - Spring Animations (iOS 17+)
    struct Spring {
        // Quick & Responsive
        static let quick = SwiftUI.Animation.spring(
            response: 0.3,
            dampingFraction: 0.7,
            blendDuration: 0
        )

        // Smooth & Natural
        static let smooth = SwiftUI.Animation.spring(
            response: 0.4,
            dampingFraction: 0.8,
            blendDuration: 0
        )

        // Bouncy & Playful
        static let bouncy = SwiftUI.Animation.spring(
            response: 0.5,
            dampingFraction: 0.6,
            blendDuration: 0
        )

        // Gentle & Subtle
        static let gentle = SwiftUI.Animation.spring(
            response: 0.6,
            dampingFraction: 0.9,
            blendDuration: 0
        )

        // Snappy & Energetic
        static let snappy = SwiftUI.Animation.spring(
            response: 0.25,
            dampingFraction: 0.65,
            blendDuration: 0
        )

        // Interactive (for gestures)
        static let interactive = SwiftUI.Animation.interactiveSpring(
            response: 0.3,
            dampingFraction: 0.7,
            blendDuration: 0
        )
    }

    // MARK: - Timing Curve Animations
    struct Curve {
        static let easeInOut = SwiftUI.Animation.easeInOut(duration: 0.3)
        static let easeIn = SwiftUI.Animation.easeIn(duration: 0.25)
        static let easeOut = SwiftUI.Animation.easeOut(duration: 0.25)
        static let linear = SwiftUI.Animation.linear(duration: 0.3)

        // Custom timing curves
        static let fluid = SwiftUI.Animation.timingCurve(0.4, 0.0, 0.2, 1.0, duration: 0.4)
        static let dramatic = SwiftUI.Animation.timingCurve(0.68, -0.55, 0.265, 1.55, duration: 0.5)
    }

    // MARK: - Duration Presets
    struct Duration {
        static let instant: Double = 0.1
        static let fast: Double = 0.2
        static let normal: Double = 0.3
        static let moderate: Double = 0.4
        static let slow: Double = 0.5
        static let verySlow: Double = 0.8
    }
}

// MARK: - Transition Effects
extension AnyTransition {
    // Slide with fade
    static var slideAndFade: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        )
    }

    // Scale with fade
    static var scaleAndFade: AnyTransition {
        .scale(scale: 0.8).combined(with: .opacity)
    }

    // Pivot from corner
    static var pivot: AnyTransition {
        .asymmetric(
            insertion: .scale(scale: 0.8, anchor: .topLeading).combined(with: .opacity),
            removal: .scale(scale: 0.8, anchor: .bottomTrailing).combined(with: .opacity)
        )
    }

    // Blur transition
    static var blur: AnyTransition {
        .modifier(
            active: BlurModifier(radius: 10),
            identity: BlurModifier(radius: 0)
        )
    }

    // Card flip
    static var flip: AnyTransition {
        .asymmetric(
            insertion: .modifier(
                active: FlipModifier(angle: -90),
                identity: FlipModifier(angle: 0)
            ),
            removal: .modifier(
                active: FlipModifier(angle: 90),
                identity: FlipModifier(angle: 0)
            )
        )
    }
}

// MARK: - Custom Transition Modifiers
struct BlurModifier: ViewModifier {
    let radius: CGFloat

    func body(content: Content) -> some View {
        content.blur(radius: radius)
    }
}

struct FlipModifier: ViewModifier {
    let angle: Double

    func body(content: Content) -> some View {
        content
            .rotation3DEffect(
                .degrees(angle),
                axis: (x: 0, y: 1, z: 0),
                perspective: 0.5
            )
    }
}

// MARK: - Animated Modifiers
struct ShakeEffect: GeometryEffect {
    var amount: CGFloat = 10
    var shakesPerUnit = 3
    var animatableData: CGFloat

    func effectValue(size: CGSize) -> ProjectionTransform {
        ProjectionTransform(
            CGAffineTransform(
                translationX: amount * sin(animatableData * .pi * CGFloat(shakesPerUnit)),
                y: 0
            )
        )
    }
}

struct PulseEffect: ViewModifier {
    @State private var isPulsing = false
    let minScale: CGFloat
    let maxScale: CGFloat

    func body(content: Content) -> some View {
        content
            .scaleEffect(isPulsing ? maxScale : minScale)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: 1.0)
                    .repeatForever(autoreverses: true)
                ) {
                    isPulsing = true
                }
            }
    }
}

struct BounceEffect: ViewModifier {
    @State private var isBouncing = false
    let delay: Double

    func body(content: Content) -> some View {
        content
            .offset(y: isBouncing ? -10 : 0)
            .onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                    withAnimation(
                        .spring(response: 0.3, dampingFraction: 0.5)
                        .repeatForever(autoreverses: true)
                    ) {
                        isBouncing = true
                    }
                }
            }
    }
}

struct RotateEffect: ViewModifier {
    @State private var isRotating = false
    let duration: Double

    func body(content: Content) -> some View {
        content
            .rotationEffect(.degrees(isRotating ? 360 : 0))
            .onAppear {
                withAnimation(
                    .linear(duration: duration)
                    .repeatForever(autoreverses: false)
                ) {
                    isRotating = true
                }
            }
    }
}

// MARK: - Loading Animations
struct LoadingDotsView: View {
    @State private var shouldAnimate = false

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(ModernTheme.Colors.primary)
                    .frame(width: 8, height: 8)
                    .scaleEffect(shouldAnimate ? 1.0 : 0.5)
                    .animation(
                        .easeInOut(duration: 0.6)
                        .repeatForever()
                        .delay(Double(index) * 0.2),
                        value: shouldAnimate
                    )
            }
        }
        .onAppear {
            shouldAnimate = true
        }
    }
}

struct LoadingSpinnerView: View {
    @State private var isAnimating = false

    var body: some View {
        Circle()
            .trim(from: 0, to: 0.7)
            .stroke(
                ModernTheme.Colors.primary,
                style: StrokeStyle(lineWidth: 3, lineCap: .round)
            )
            .frame(width: 30, height: 30)
            .rotationEffect(.degrees(isAnimating ? 360 : 0))
            .onAppear {
                withAnimation(
                    .linear(duration: 1)
                    .repeatForever(autoreverses: false)
                ) {
                    isAnimating = true
                }
            }
    }
}

struct LoadingPulseView: View {
    @State private var isPulsing = false

    var body: some View {
        Circle()
            .fill(ModernTheme.Colors.primary.opacity(0.6))
            .frame(width: 40, height: 40)
            .scaleEffect(isPulsing ? 1.2 : 0.8)
            .opacity(isPulsing ? 0.3 : 0.8)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: 1.2)
                    .repeatForever(autoreverses: true)
                ) {
                    isPulsing = true
                }
            }
    }
}

// MARK: - Skeleton Loading
struct SkeletonView: View {
    @State private var isAnimating = false

    var body: some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [
                        Color.gray.opacity(0.3),
                        Color.gray.opacity(0.1),
                        Color.gray.opacity(0.3)
                    ],
                    startPoint: isAnimating ? .leading : .trailing,
                    endPoint: isAnimating ? .trailing : .leading
                )
            )
            .onAppear {
                withAnimation(
                    .linear(duration: 1.5)
                    .repeatForever(autoreverses: false)
                ) {
                    isAnimating = true
                }
            }
    }
}

// MARK: - Success Animation
struct SuccessCheckmarkView: View {
    @State private var trimEnd: CGFloat = 0
    @State private var scale: CGFloat = 0

    var body: some View {
        ZStack {
            Circle()
                .fill(ModernTheme.Colors.success)
                .frame(width: 60, height: 60)
                .scaleEffect(scale)

            Path { path in
                path.move(to: CGPoint(x: 20, y: 30))
                path.addLine(to: CGPoint(x: 27, y: 37))
                path.addLine(to: CGPoint(x: 40, y: 23))
            }
            .trim(from: 0, to: trimEnd)
            .stroke(Color.white, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
        }
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                scale = 1.0
            }
            withAnimation(.easeOut(duration: 0.4).delay(0.2)) {
                trimEnd = 1.0
            }
        }
    }
}

// MARK: - View Extensions for Animations
extension View {
    func shake(trigger: Int) -> some View {
        modifier(ShakeEffect(animatableData: CGFloat(trigger)))
    }

    func pulse(minScale: CGFloat = 0.95, maxScale: CGFloat = 1.05) -> some View {
        modifier(PulseEffect(minScale: minScale, maxScale: maxScale))
    }

    func bounce(delay: Double = 0) -> some View {
        modifier(BounceEffect(delay: delay))
    }

    func rotate(duration: Double = 2.0) -> some View {
        modifier(RotateEffect(duration: duration))
    }

    // Animated appearance
    func animatedAppearance(delay: Double = 0) -> some View {
        modifier(AnimatedAppearanceModifier(delay: delay))
    }

    // Card press effect
    func cardPressEffect() -> some View {
        modifier(CardPressEffectModifier())
    }
}

// MARK: - Animated Appearance Modifier
struct AnimatedAppearanceModifier: ViewModifier {
    @State private var isVisible = false
    let delay: Double

    func body(content: Content) -> some View {
        content
            .opacity(isVisible ? 1 : 0)
            .offset(y: isVisible ? 0 : 20)
            .onAppear {
                withAnimation(
                    FleetAnimations.Spring.smooth.delay(delay)
                ) {
                    isVisible = true
                }
            }
    }
}

// MARK: - Card Press Effect Modifier
struct CardPressEffectModifier: ViewModifier {
    @State private var isPressed = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .animation(FleetAnimations.Spring.quick, value: isPressed)
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in
                        if !isPressed {
                            isPressed = true
                            ModernTheme.Haptics.light()
                        }
                    }
                    .onEnded { _ in
                        isPressed = false
                    }
            )
    }
}

// MARK: - Matched Geometry Effect Namespace
extension View {
    @ViewBuilder
    func matchedTransition(id: String, in namespace: Namespace.ID) -> some View {
        self.matchedGeometryEffect(id: id, in: namespace)
    }
}

// MARK: - Phase Animator Examples (iOS 17+)
@available(iOS 17.0, *)
struct PhaseAnimatorExample: View {
    var body: some View {
        PhaseAnimator([false, true]) { phase in
            Circle()
                .fill(phase ? ModernTheme.Colors.primary : ModernTheme.Colors.secondary)
                .scaleEffect(phase ? 1.2 : 1.0)
                .frame(width: 50, height: 50)
        } animation: { phase in
            .spring(response: 0.4, dampingFraction: 0.6)
        }
    }
}

// MARK: - Keyframe Animator Examples (iOS 17+)
@available(iOS 17.0, *)
struct KeyframeAnimatorExample: View {
    @State private var trigger = false

    var body: some View {
        KeyframeAnimator(
            initialValue: AnimationValues(),
            trigger: trigger
        ) { values in
            Circle()
                .fill(ModernTheme.Colors.primary)
                .frame(width: 50, height: 50)
                .scaleEffect(values.scale)
                .offset(y: values.verticalTranslation)
                .rotationEffect(.degrees(values.rotation))
        } keyframes: { _ in
            KeyframeTrack(\.scale) {
                CubicKeyframe(1.2, duration: 0.2)
                CubicKeyframe(1.0, duration: 0.3)
            }

            KeyframeTrack(\.verticalTranslation) {
                CubicKeyframe(-50, duration: 0.2)
                SpringKeyframe(0, duration: 0.3, spring: .bouncy)
            }

            KeyframeTrack(\.rotation) {
                CubicKeyframe(0, duration: 0)
                CubicKeyframe(360, duration: 0.5)
            }
        }
        .onTapGesture {
            trigger.toggle()
        }
    }
}

@available(iOS 17.0, *)
struct AnimationValues {
    var scale = 1.0
    var verticalTranslation = 0.0
    var rotation = 0.0
}

// MARK: - Pull to Refresh Custom Animation
struct PullToRefreshView: View {
    @Binding var isRefreshing: Bool
    let onRefresh: () async -> Void

    @State private var offset: CGFloat = 0
    @State private var rotation: Double = 0

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(spacing: 0) {
                    // Pull indicator
                    HStack {
                        Spacer()
                        ZStack {
                            Circle()
                                .stroke(ModernTheme.Colors.primary.opacity(0.3), lineWidth: 2)
                                .frame(width: 30, height: 30)

                            if isRefreshing {
                                LoadingSpinnerView()
                            } else {
                                Image(systemName: "arrow.down")
                                    .foregroundColor(ModernTheme.Colors.primary)
                                    .rotationEffect(.degrees(rotation))
                            }
                        }
                        .padding(.top, 10)
                        .opacity(offset > 50 ? 1 : Double(offset) / 50.0)
                        Spacer()
                    }

                    // Content goes here
                }
            }
        }
    }
}
