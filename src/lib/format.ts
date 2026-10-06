const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("fr-FR");

export function formatCurrency(value: number): string {
  return currency.format(value);
}

export function formatNumber(value: number): string {
  return number.format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: digits })} %`;
}

export function formatFileSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo` : `${kb} Ko`;
}
