export const paymentPackages = [
  { code: "starter", name: "Starter", priceCents: 799, credits: 5 },
  { code: "plus", name: "Plus", priceCents: 1499, credits: 10 },
  { code: "pro", name: "Pro", priceCents: 1999, credits: 20 },
  { code: "premium", name: "Premium", priceCents: 2499, credits: 35 }
] as const;

export type PackageCode = (typeof paymentPackages)[number]["code"];

export function getPaymentPackage(code: string) {
  return paymentPackages.find((item) => item.code === code);
}
