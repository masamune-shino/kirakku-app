type SalespersonColor = {
  text: string;
  bg: string;
  border: string;
};

// ステータスバッジで使う amber/blue/green とは被らない色相を選定
const PALETTE: SalespersonColor[] = [
  { text: "text-purple-700", bg: "bg-purple-100", border: "border-purple-300" },
  { text: "text-pink-700", bg: "bg-pink-100", border: "border-pink-300" },
  { text: "text-teal-700", bg: "bg-teal-100", border: "border-teal-300" },
  { text: "text-indigo-700", bg: "bg-indigo-100", border: "border-indigo-300" },
  { text: "text-orange-700", bg: "bg-orange-100", border: "border-orange-300" },
  { text: "text-rose-700", bg: "bg-rose-100", border: "border-rose-300" },
  { text: "text-fuchsia-700", bg: "bg-fuchsia-100", border: "border-fuchsia-300" },
  { text: "text-cyan-700", bg: "bg-cyan-100", border: "border-cyan-300" },
  { text: "text-lime-700", bg: "bg-lime-100", border: "border-lime-300" },
  { text: "text-violet-700", bg: "bg-violet-100", border: "border-violet-300" },
];

function hashToIndex(id: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

export function getSalespersonColor(salespersonId: string): SalespersonColor {
  return PALETTE[hashToIndex(salespersonId, PALETTE.length)];
}
