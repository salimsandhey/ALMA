// Single source of truth for the student bottom nav — shared by the real
// tab navigator ((student)/_layout.tsx) and the look-alike bar rendered on
// screens outside the tab group (components/BottomNavBar.tsx). Change tabs
// here once instead of in both places.
export const NAV_TABS = [
  { key: 'home', label: 'Home', icon: 'home-outline', route: '/(student)/home' },
  { key: 'modules', label: 'Modules', icon: 'book-outline', route: '/(student)/modules' },
  { key: 'explore', label: 'Entertainment', icon: 'film-outline', route: '/(student)/explore' },
  { key: 'music', label: 'Music', icon: 'musical-notes-outline', route: '/(student)/music' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', route: '/(student)/profile' },
] as const

export const NAV_BAR_HEIGHT_BASE = 60
export const NAV_BAR_BORDER_COLOR = '#E5E7EB'
export const NAV_ICON_SIZE = 22
export const NAV_LABEL_STYLE = { fontSize: 11, fontWeight: '500' as const }
