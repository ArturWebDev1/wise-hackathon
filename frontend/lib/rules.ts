export type RiskRules = {
  checkNew: boolean;
  favouriteIds: string[];
  /** `null` means the limit check is switched off. */
  limit: number | null;
};

/** Mirrors the server's rule: a new person (when checked) or an amount over the limit. */
export function isRisky(rules: RiskRules, recipient: { id: string }, amount: number) {
  return (
    (rules.checkNew && !rules.favouriteIds.includes(recipient.id)) ||
    (rules.limit !== null && amount > rules.limit)
  );
}
export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
export function validIban(iban: string) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (char) =>
    String(char.charCodeAt(0) - 55),
  );
  let remainder = 0;
  for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}
