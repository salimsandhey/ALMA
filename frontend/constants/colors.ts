// Single source of truth for all brand colors.
// Import from here — never declare local color constants in screen files.

export const NAVY      = '#093373'
export const NAVY_DARK = '#072868'
export const GOLD      = '#F6B80D'
export const TEAL      = '#0D9488'
export const BG        = '#F3F4F6'
export const WHITE     = '#FFFFFF'
export const GREY      = '#6B7280'
export const LIGHT_GREY = '#9CA3AF'
export const CARD      = '#FFFFFF'
export const RED       = '#EF4444'
export const GREEN     = '#16A34A'

// Legacy object — kept for any code already using Colors.xxx
export const Colors = {
  navy:      NAVY,
  navyDark:  NAVY_DARK,
  gold:      GOLD,
  teal:      TEAL,
  bg:        BG,
  white:     WHITE,
  grey:      GREY,
  lightGrey: LIGHT_GREY,
  card:      CARD,
  red:       RED,
  green:     GREEN,
}
