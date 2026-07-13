const PRESETS = [
  { emoji: "🧥", gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)" },
  { emoji: "", gradient: "linear-gradient(135deg, #f97316, #fb7185)" },
  { emoji: "👜", gradient: "linear-gradient(135deg, #fbbf24, #f97316)" },
  { emoji: "🕶️", gradient: "linear-gradient(135deg, #14b8a6, #0284c7)" },
  { emoji: "🍶", gradient: "linear-gradient(135deg, #38bdf8, #818cf8)" },
  { emoji: "🎧", gradient: "linear-gradient(135deg, #a78bfa, #ec4899)" },
];

export function getProductVisuals(productId) {
  return PRESETS[productId % PRESETS.length];
}

export function getStockTag(stock) {
  if (stock <= 0) return "Out of stock";
  if (stock <= 5) return "Low stock";
  return null;
}
