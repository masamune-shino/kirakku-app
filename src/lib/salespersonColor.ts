export type SalespersonColor = {
  text: string;
  bg: string;
  border: string;
};

// 色相環上でなるべく離れた10色を選定し、隣り合う担当同士でも一目で見分けられるようにする
// （同系色の重複を避ける: 青紫系・ピンク系はそれぞれ1色のみ）
const PALETTE: SalespersonColor[] = [
  { text: "text-orange-700", bg: "bg-orange-100", border: "border-orange-300" },
  { text: "text-yellow-700", bg: "bg-yellow-100", border: "border-yellow-300" },
  { text: "text-lime-700", bg: "bg-lime-100", border: "border-lime-300" },
  { text: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-300" },
  { text: "text-cyan-700", bg: "bg-cyan-100", border: "border-cyan-300" },
  { text: "text-indigo-700", bg: "bg-indigo-100", border: "border-indigo-300" },
  { text: "text-purple-700", bg: "bg-purple-100", border: "border-purple-300" },
  { text: "text-pink-700", bg: "bg-pink-100", border: "border-pink-300" },
  { text: "text-slate-700", bg: "bg-slate-200", border: "border-slate-400" },
  { text: "text-rose-700", bg: "bg-rose-100", border: "border-rose-300" },
];

const FALLBACK_COLOR: SalespersonColor = {
  text: "text-slate-700",
  bg: "bg-slate-100",
  border: "border-slate-300",
};

/**
 * 営業担当一覧からID→色のマップを作る。
 * IDをソートしてから順番にパレットを割り当てるため、人数がパレット数（10）以下であれば
 * 全員が確実に異なる色になる（単純なハッシュだと衝突しうるため、この方式を採る）。
 */
export function buildSalespersonColorMap(
  salespersons: { id: string }[],
): Map<string, SalespersonColor> {
  const sorted = [...salespersons].sort((a, b) => a.id.localeCompare(b.id));
  const map = new Map<string, SalespersonColor>();
  sorted.forEach((sp, i) => {
    map.set(sp.id, PALETTE[i % PALETTE.length]);
  });
  return map;
}

export { FALLBACK_COLOR };
