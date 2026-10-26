/** Link helpers with no server dependencies, shared by server and client components. */

export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return `tel:${digits}`;
  if (digits.startsWith("0")) return `tel:+251${digits.slice(1)}`;
  return `tel:${digits}`;
}

export function externalUrl(u: string) {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}
