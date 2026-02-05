/**
 * UI/UX Pro Max Design System Demo
 *
 * Showcasing the redesigned Fleet Management interface using
 * the ui-ux-pro-max-skill design principles
 */

import { FleetHubProMax } from '@/components/redesign/FleetHubProMax'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export function UIProMaxDemo() {
  return (
    <div className="min-h-screen">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Original</span>
            </Link>
            <div>
              <h1 className="font-bold text-lg">UI/UX Pro Max Redesign</h1>
              <p className="text-sm text-white/90">
                Professional Fleet Management Dashboard
              </p>
            </div>
          </div>
          <a
            href="https://github.com/nextlevelbuilder/ui-ux-pro-max-skill"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 cursor-pointer"
          >
            <span className="font-medium">Design System</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Design Principles Applied */}
      <div className="bg-slate-50 border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-600"><strong>Style:</strong> Glassmorphism + Bento Grid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600"><strong>Palette:</strong> Professional Tech (Blue-Gray)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-slate-600"><strong>Typography:</strong> Inter + Manrope</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-slate-600"><strong>Transitions:</strong> 250ms smooth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-600"><strong>Accessibility:</strong> WCAG AA compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Redesigned Interface */}
      <FleetHubProMax />

      {/* Design Notes Footer */}
      <div className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Design System Features Applied</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">✨ Glassmorphism</h3>
              <p className="text-sm text-slate-600">
                Backdrop blur effects with semi-transparent backgrounds create depth and modern aesthetics while maintaining readability.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">📐 Bento Box Grid</h3>
              <p className="text-sm text-slate-600">
                Asymmetric grid layout optimizes information hierarchy and creates visual interest while maintaining responsiveness.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">🎨 Professional Palette</h3>
              <p className="text-sm text-slate-600">
                Industry-specific color palette with blue-gray base, gradient accents, and safety-focused contrast ratios (4.5:1+).
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">⚡ Smooth Transitions</h3>
              <p className="text-sm text-slate-600">
                200-300ms transitions with easeOut timing create polished interactions. Respects prefers-reduced-motion for accessibility.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">♿ Accessibility</h3>
              <p className="text-sm text-slate-600">
                WCAG AA compliant with visible focus states, keyboard navigation, screen reader support, and reduced motion preferences.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">📱 Responsive Design</h3>
              <p className="text-sm text-slate-600">
                Breakpoints at 375px, 768px, 1024px, 1440px ensure optimal experience across all devices with touch-friendly spacing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UIProMaxDemo
