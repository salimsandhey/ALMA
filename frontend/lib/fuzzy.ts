export function similarity(a: string, b: string): number {
  const aL = a.toLowerCase().trim()
  const bL = b.toLowerCase().trim()
  if (aL === bL) return 1
  if (aL.includes(bL) || bL.includes(aL)) return 0.85
  const longer = aL.length > bL.length ? aL : bL
  const shorter = aL.length > bL.length ? bL : aL
  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++
  }
  return matches / longer.length
}
