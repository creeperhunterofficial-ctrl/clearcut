// Prices and limits. Defaults match the business model; the admin dashboard
// can override them at runtime via the app_settings table.
export const DEFAULTS = {
  price30sPaise: 700, // ₹7
  price60sPaise: 1200, // ₹12
  minTopupPaise: 1000, // ₹10
  maxVideoSeconds: 60,
  maxUploadMb: 100,
  downloadExpiryHours: 24,
} as const;

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(paise % 100 === 0 ? 0 : 2)}`;
}
