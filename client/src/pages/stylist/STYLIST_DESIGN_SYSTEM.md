# Stylist Portal Design System

## Color Palette (Distinct from Consumer Rose/Gold)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `stylist-50` | `#eef2ff` | — | Light bg, hover states |
| `stylist-100` | `#e0e7ff` | — | Pill bg, light accents |
| `stylist-200` | `#c7d2fe` | — | Borders |
| `stylist-400` | `#818cf8` | — | Icons, secondary text |
| `stylist-500` | `#6366f1` | `#818cf8` | Primary accent, buttons |
| `stylist-600` | `#4f46e5` | `#6366f1` | Active states, hover |
| `stylist-700` | `#4338ca` | `#4f46e5` | Pressed states |
| `stylist-900` | `#312e81` | `#e0e7ff` | Headings on light bg |

### Surface Colors
- Sidebar bg: `#0f172a` (slate-900) / dark: `#0a0a0f`
- Sidebar text: `#94a3b8` / dark: `#a1a1aa`
- Sidebar active: `#6366f1` with `rgba(99,102,241,0.1)` bg
- Card bg: `#ffffff` / dark: `#18181b`
- Page bg: `#f8fafc` / dark: `#09090b`
- Navbar bg: `rgba(255,255,255,0.92)` / dark: `rgba(24,24,27,0.92)`

### Semantic Colors (shared with consumer)
- Success: `#10b981`
- Warning: `#f59e0b`
- Error: `#ef4444`
- Info: `#3b82f6`

## Typography
- Headings: `Plus Jakarta Sans` (same as consumer)
- Body: `Inter` (same as consumer)
- Dashboard stats: `font-black text-2xl sm:text-3xl`
- Card titles: `text-sm font-semibold uppercase tracking-wider`
- Section headers: `text-xs font-bold uppercase tracking-[0.15em]`

## Spacing
- Sidebar width: 64px (collapsed), 256px (expanded)
- Card padding: `p-4 sm:p-5`
- Section gap: `space-y-5 sm:space-y-6`
- Content max-width: `max-w-7xl`

## Shadows
- Card: `0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)`
- Elevated: `0 4px 12px rgba(0,0,0,0.06)`
- Hover: `0 8px 24px rgba(0,0,0,0.08)`

## Animation
- Same as consumer: `fadeIn 0.3s ease-out`, `slideUp 0.3s ease-out`
- Cards: stagger children with 0.05s delay
- Buttons: `transition-all duration-150`

## Touch Targets
- All buttons: `min-h-[44px]` (mobile), `min-h-[48px]` where possible
- Icon buttons: `min-w-[44px]` with `p-2.5`
- Fonts: `text-sm` minimum on mobile, `text-base` where space allows

## Icons
- Lucide React icons (same as consumer)
- Use `strokeWidth={1.5}` default, `strokeWidth={2.5}` for active nav
