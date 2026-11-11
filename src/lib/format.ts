const aed = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

/** "AED 1,928" */
export const formatAED = (amount: number) => aed.format(amount).replace(/ /g, " ");

const number = new Intl.NumberFormat("en-US");
export const formatNumber = (n: number) => number.format(n);

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
