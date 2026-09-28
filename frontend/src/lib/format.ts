export function toman(value: number): string {
  return value.toLocaleString("fa-IR");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}
