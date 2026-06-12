# ALMA UI Responsiveness Fix Plan

## Context
This plan covers all UI layout and responsiveness issues found across the ALMA app — both the **Admin Panel** and **Student (User) Side**. Issues were identified by deep static analysis of every screen file. The target device range is small Android phones (~360px wide) through normal iPhones (390px). The app is React Native / Expo.

---

## Root Cause Patterns (Fix These Everywhere)

Before touching individual files, understand these 6 recurring anti-patterns:

1. **Missing `numberOfLines` on text in flex rows** — text wraps and breaks layouts
2. **Row layouts without `flexWrap`** — badges/buttons overflow off-screen
3. **No `flex` allocation in rows** — items compete equally instead of priority order
4. **Modal `maxHeight` too aggressive (90–94%)** — keyboard pushes content off-screen
5. **Download/action buttons with long text and no truncation** — collapse on small screens
6. **Hardcoded `minHeight` on inputs** — forms become too tall on short devices

---

## PHASE 1 — Admin Panel: Download Report Buttons (User-Reported Bug)

### Files: `app/(admin)/overview.tsx`, `app/(admin)/students.tsx`

**Problem:** The "Download Master Report" button collapses on smaller screens. Both files share the same issue.

**Fixes:**
- Wrap the download button in a `View` with `flexShrink: 1`
- Add `numberOfLines={1}` and `adjustsFontSizeToFit` to button text
- Replace fixed `minWidth: 48` with `flexShrink: 1, alignSelf: 'flex-start'`
- Add `flexWrap: 'wrap'` to the toolbar row containing the button so it wraps to next line on narrow screens instead of collapsing
- Ensure button label abbreviates gracefully: show "Download Report" not full text, or use an icon-only fallback below 380px width using `useWindowDimensions()`

**Pattern to apply:**
```tsx
// Before
<TouchableOpacity style={styles.downloadBtn}>
  <Text>Download Master Report</Text>
</TouchableOpacity>

// After
const { width } = useWindowDimensions();
const isNarrow = width < 380;

<TouchableOpacity style={[styles.downloadBtn, { flexShrink: 1 }]}>
  <Ionicons name="download-outline" size={16} color="#fff" />
  {!isNarrow && (
    <Text numberOfLines={1} style={styles.downloadBtnText}>
      Download Report
    </Text>
  )}
</TouchableOpacity>
```

---

## PHASE 2 — Admin Panel: `modules.tsx` (Most Complex)

**File:** `app/(admin)/modules.tsx`

This is the most item-dense file. Fix in this order:

### 2A — Module Card Row
**Problem:** Emoji + title + draft badge + switch + edit btn + delete btn — 6 items in one row with no allocation.
**Fix:**
- Give title `flex: 1` and `numberOfLines={1}`
- Move edit/delete buttons to a second row or use a `...` menu (3-dot) on narrow screens
- Switch gets `flexShrink: 0`

### 2B — Lesson Row
**Problem:** Same as module card — title squeezed by action buttons.
**Fix:** Same pattern — `flex: 1` on title, `numberOfLines={1}`, action buttons right-aligned with fixed width

### 2C — Emoji Grid
**Problem:** Fixed `42x42` cells can overflow parent on narrow screens.
**Fix:** Use `(screenWidth - padding * 2) / numColumns` to calculate cell size dynamically

### 2D — Step Dots Connector
**Problem:** `dotLine: { width: 56 }` is hardcoded.
**Fix:** Replace with `flex: 1` on the connector line so it fills available space

### 2E — True/False Button Row
**Problem:** Label + 2 buttons in `gap: 10` — buttons compress.
**Fix:** Buttons get `flex: 1`, text gets `numberOfLines={1}`

### 2F — Dialogue Scenario Input
**Problem:** `minHeight: 64` hardcoded.
**Fix:** Change to `minHeight: 56` and cap with `maxHeight: 120`

### 2G — Image/Emoji Picker Buttons
**Problem:** Two `flex: 1` buttons with emoji + text.
**Fix:** `numberOfLines={1}` on button text

---

## PHASE 3 — Admin Panel: `challenges.tsx` and `songs.tsx`

### 3A — `challenges.tsx`

| Issue | Fix |
|-------|-----|
| Card header: order badge + question + switch | Add `flex: 1` to question wrapper, `flexShrink: 0` to switch |
| Keyword chips: no max width | Add `maxWidth: screenWidth * 0.4` to each chip |
| Card action buttons: no wrap | Add `flexWrap: 'wrap'` to actions row |
| Modal `maxHeight: '92%'` | Change to `maxHeight: '85%'`, add `KeyboardAvoidingView` inside modal |
| Long keywords overflow chips | `numberOfLines={1}` on chip text |

### 3B — `songs.tsx`

| Issue | Fix |
|-------|-----|
| Song title no `numberOfLines` | Add `numberOfLines={1}` to title in card row |
| Lyrics input `minHeight: 160` | Change to `minHeight: 100, maxHeight: 200` |
| Modal `maxHeight: '94%'` | Change to `maxHeight: '85%'` |
| YouTube URL truncation | Keep `numberOfLines={1}`, add `ellipsizeMode="middle"` so domain is visible |
| Emoji input fixed `width: 52` | Change to `width: 48, flexShrink: 0` |

---

## PHASE 4 — Admin Panel: `feedback.tsx`, `content.tsx`, `legal.tsx`

### 4A — `feedback.tsx`

| Issue | Fix |
|-------|-----|
| Name + badge row overlap | Give name `flex: 1, numberOfLines={1}`, badge `flexShrink: 0` |
| Meta row: topic + emoji + date no wrap | Add `flexWrap: 'wrap'` |
| Reply input `minHeight: 110` | Change to `minHeight: 80` |
| No `maxHeight` on modal | Add `maxHeight: '88%'` |

### 4B — `content.tsx`

| Issue | Fix |
|-------|-----|
| Card URL text no `numberOfLines` | Add `numberOfLines={1}` and `ellipsizeMode="tail"` |
| Action buttons crowd URL area | Move actions to right-aligned fixed column, URL gets `flex: 1` |
| Modal `maxHeight: '90%'` | Change to `maxHeight: '85%'` with `KeyboardAvoidingView` |

### 4C — `legal.tsx`

| Issue | Fix |
|-------|-----|
| Meta row: reset button squeezes | Give meta text `flex: 1`, reset button `flexShrink: 0` |
| Section order buttons row | Use `gap: 4` instead of `gap: 2`, ensure total button width is fixed |
| Body text input `minHeight: 80` | Cap to `maxHeight: 200` |
| Reset button text hidden | Ensure `paddingHorizontal: 8` minimum on reset button |

---

## PHASE 5 — Admin Panel: `ai-usage.tsx`

| Issue | Fix |
|-------|-----|
| Period selector overflow | `flex: 1` on each button, `numberOfLines={1}`, abbreviate: "7d" / "30d" / "All" on narrow screens |
| Bar chart fixed `height: 100` | Change to `height: 120`, add `minWidth: 6` and `maxWidth: 24` per bar |
| Bar date labels `fontSize: 8` | Rotate labels 45°, show every Nth label based on screen width |
| Cost card label overflow | `numberOfLines={2}` on label, `numberOfLines={1}` on hint |
| User rank rows no allocation | Name `flex: 1, numberOfLines={1}`, cost `flexShrink: 0` |

---

## PHASE 6 — Admin Panel: `overview.tsx` and `students.tsx` (Remaining Issues)

### After Phase 1 fixes, also fix:

#### `overview.tsx`
| Issue | Fix |
|-------|-----|
| Stat card `minWidth: '44%'` | Keep but add `flexGrow: 1` |
| FlatList inside modal | Add explicit `maxHeight: 300` to FlatList container |

#### `students.tsx`
| Issue | Fix |
|-------|-----|
| Student stat row `gap: 14` | Reduce to `gap: 8`, add `flexWrap: 'wrap'` |
| Long email/country no truncation | `numberOfLines={1}` on info values, `ellipsizeMode="tail"` |
| Student name + badge overlap | `flex: 1, numberOfLines={1}` on name, badge `flexShrink: 0` |
| Bottom sheet `maxHeight: 91%` | Change to `maxHeight: '85%'` |

---

## PHASE 7 — Admin Panel: `_layout.tsx` and `more.tsx`

### `_layout.tsx`
| Issue | Fix |
|-------|-----|
| Tab bar `height: 64` | Keep (standard), but add `paddingBottom: insets.bottom` from `useSafeAreaInsets()` |
| Tab label `fontSize: 10` | Keep as-is (standard mobile tab size) |

### `more.tsx`
| Issue | Fix |
|-------|-----|
| Card subtitle `lineHeight: 17` at `fontSize: 12` | Change `lineHeight` to `18`, add `numberOfLines={2}` |
| Icon `52x52` fixed | Keep (intentional design size) |

---

## PHASE 8 — Student Side: `profile.tsx` (Hexagon Layout)

**File:** `app/(student)/profile.tsx`

**Problem:** The hexagon stat shapes use hardcoded pixel math (`R = 28`, `HEX_W = 56`, `HEX_H = 48`, `TRI_W = 14`, `RECT_W = 28`). On screens narrower than ~330px these overflow.

**Fix approach:**
- Import `useWindowDimensions` at the top
- Compute a `scale` factor: `const scale = Math.min(1, (screenWidth - 48) / 320)`
- Multiply all hexagon constants by `scale`:
  ```tsx
  const R = 28 * scale;
  const HEX_W = 56 * scale;
  const HEX_H = 48 * scale;
  const TRI_W = 14 * scale;
  const RECT_W = 28 * scale;
  ```
- Avatar ring: change `width: 86, height: 86` → compute from scale
- Decorative circles (`160x160`, `70x70`): change to percentage of screen width

---

## PHASE 9 — Student Side: `login.tsx` and `register.tsx`

**File:** `app/(auth)/login.tsx`, `app/(auth)/register.tsx`

| Issue | Fix |
|-------|-----|
| Logo fixed `160x52` | Change to `width: screenWidth * 0.42, height: undefined, aspectRatio: 160/52` |
| Apple button `height: 54` | Keep (Apple HIG minimum), but ensure keyboard avoidance wraps the whole form |
| Keyboard overlap | Verify `KeyboardAvoidingView behavior="padding"` wraps entire screen, add `keyboardVerticalOffset` |
| Modal `paddingHorizontal: 28` | Change to `paddingHorizontal: Math.max(16, screenWidth * 0.07)` |

---

## PHASE 10 — Student Side: `home.tsx`

**File:** `app/(student)/home.tsx`

| Issue | Fix |
|-------|-----|
| Progress card `height: 220` | Change to `minHeight: 180, height: undefined` — let content size it |
| Stat card skeleton `height: 96` | Change to `minHeight: 80` |
| Progress ring `size = 70` | Change to `size = Math.min(70, screenWidth * 0.18)` |
| Avatar `40x40` | Keep (standard size) |
| Greeting `fontSize: 26` | Change to `fontSize: screenWidth < 375 ? 22 : 26` |

---

## PHASE 11 — Student Side: Game Components

### `components/lesson/DialogueGame.tsx`
| Issue | Fix |
|-------|-----|
| `paddingBottom: 60` hardcoded | Replace with `paddingBottom: insets.bottom + 60` using `useSafeAreaInsets()` |

### `components/lesson/TrueFalseGame.tsx`
| Issue | Fix |
|-------|-----|
| Timer + buttons + explanation overflow | Wrap entire screen in `ScrollView` with `contentContainerStyle={{ flexGrow: 1 }}` |
| `marginTop: 14` spacing | Reduce to `marginTop: 10` on small screens |

### `components/lesson/WordMatchGame.tsx`
| Issue | Fix |
|-------|-----|
| Pills no max width | Add `maxWidth: screenWidth * 0.42` to each pill |

---

## PHASE 12 — Student Side: `BottomNavBar.tsx`

**File:** `components/BottomNavBar.tsx`

| Issue | Fix |
|-------|-----|
| Fixed `height: 60` | Change to `height: 60 + insets.bottom` using `useSafeAreaInsets()` |
| `paddingBottom: 8` | Change to `paddingBottom: insets.bottom + 8` |

This is a quick win and affects every student screen.

---

## PHASE 13 — Student Side: `modules.tsx`, `explore.tsx`, `music.tsx`

### `app/(student)/modules.tsx`
| Issue | Fix |
|-------|-----|
| Card emoji box `48x48` | Keep — standard icon size |
| Progress bar `height: 3` | Keep — intentional thin bar |
| Skeleton hardcoded dimensions | Match to real content dimensions from Phase 10 |

### `app/(student)/explore.tsx` and `music.tsx`
- These are mostly `flex`-based — spot-check card title `numberOfLines` on content cards
- Add `numberOfLines={2}` to any card title that currently has none

---

## Implementation Notes for New Chat

### Utilities to add once, use everywhere
Add this to a shared `hooks/useResponsive.ts`:
```tsx
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return {
    width,
    height,
    insets,
    isNarrow: width < 375,
    isSmall: width < 390,
    scale: Math.min(1, width / 390),
  };
}
```

### Modal pattern to standardize
All admin modals should use this wrapper:
```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1, justifyContent: 'flex-end' }}
>
  <View style={[styles.sheet, { maxHeight: SCREEN_HEIGHT * 0.85 }]}>
    <ScrollView keyboardShouldPersistTaps="handled">
      {/* modal content */}
    </ScrollView>
  </View>
</KeyboardAvoidingView>
```

---

## Fix Priority Order (Quick Reference)

| Phase | Files | Effort | Impact |
|-------|-------|--------|--------|
| 1 | overview.tsx, students.tsx — download buttons | Low | 🔴 Critical (user-reported) |
| 2 | modules.tsx (admin) | High | 🔴 Critical |
| 3 | challenges.tsx, songs.tsx | Medium | 🔴 High |
| 4 | feedback.tsx, content.tsx, legal.tsx | Medium | 🟡 Medium |
| 5 | ai-usage.tsx | Medium | 🟡 Medium |
| 6 | overview.tsx, students.tsx remaining | Low | 🟡 Medium |
| 7 | _layout.tsx, more.tsx | Low | 🟢 Low |
| 8 | profile.tsx (student) | High | 🔴 High |
| 9 | login.tsx, register.tsx | Low | 🔴 High |
| 10 | home.tsx (student) | Medium | 🟡 Medium |
| 11 | Game components | Medium | 🟡 Medium |
| 12 | BottomNavBar.tsx | Low | 🟡 Quick win |
| 13 | modules.tsx, explore.tsx, music.tsx (student) | Low | 🟢 Low |

---

## Files Changed (Complete List)

**Admin Panel:**
- `app/(admin)/overview.tsx`
- `app/(admin)/students.tsx`
- `app/(admin)/modules.tsx`
- `app/(admin)/challenges.tsx`
- `app/(admin)/songs.tsx`
- `app/(admin)/feedback.tsx`
- `app/(admin)/content.tsx`
- `app/(admin)/legal.tsx`
- `app/(admin)/ai-usage.tsx`
- `app/(admin)/_layout.tsx`
- `app/(admin)/more.tsx`

**Student Side:**
- `app/(student)/home.tsx`
- `app/(student)/profile.tsx`
- `app/(student)/modules.tsx`
- `app/(student)/explore.tsx`
- `app/(student)/music.tsx`
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `components/BottomNavBar.tsx`
- `components/lesson/DialogueGame.tsx`
- `components/lesson/TrueFalseGame.tsx`
- `components/lesson/WordMatchGame.tsx`

**New file:**
- `hooks/useResponsive.ts` (shared utility)
