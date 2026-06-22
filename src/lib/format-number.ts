const fmt = new Intl.NumberFormat("en-US");

export function formatNumber(n: number): string {
  return fmt.format(n);
}
