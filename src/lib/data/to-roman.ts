export function toRoman(tier: number) {
  if (tier <= 0) return "—";
  const map = ["I", "II", "III"];
  return map[tier - 1] ?? "IV+";
}
