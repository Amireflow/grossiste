export const CURRENCIES: Record<string, { symbol: string; name: string }> = {
  XOF: { symbol: "FCFA", name: "Franc CFA (BCEAO)" },
  XAF: { symbol: "FCFA", name: "Franc CFA (BEAC)" },
  NGN: { symbol: "₦", name: "Naira" },
  GHS: { symbol: "GH₵", name: "Cedi" },
};

export const COUNTRIES = [
  "Bénin", "Burkina Faso", "Côte d'Ivoire", "Guinée",
  "Mali", "Niger", "Sénégal", "Togo", "Ghana", "Nigeria",
];

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  processing: { label: "En cours", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  shipped: { label: "Expédiée", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  delivered: { label: "Livrée", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export const UNITS = [
  { value: "unité", label: "Unité" },
  { value: "kg", label: "Kilogramme (kg)" },
  { value: "litre", label: "Litre (L)" },
  { value: "carton", label: "Carton" },
  { value: "sac", label: "Sac" },
  { value: "paquet", label: "Paquet" },
  { value: "bouteille", label: "Bouteille" },
  { value: "boîte", label: "Boîte" },
  { value: "lot", label: "Lot" },
];

export function formatPrice(price: string | number, currency: string = "XOF"): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  const curr = CURRENCIES[currency] || CURRENCIES.XOF;
  return `${num.toLocaleString("fr-FR")} ${curr.symbol}`;
}
