export type DemoAccount = { wiseId: string; name: string; iban: string };

/**
 * Wise accounts a new recipient can be found by. Hard-coded until the backend lookup
 * (`GET /recipients/lookup?wiseId=...`) is connected; the IBAN is only for the Node prototype.
 */
export const demoAccounts: DemoAccount[] = [
  { wiseId: 'ola', name: 'Ola Nordmann', iban: 'DE89370400440532013000' },
  { wiseId: 'liisa', name: 'Liisa Tamm', iban: 'GB82WEST12345698765432' },
  { wiseId: 'pavel', name: 'Pavel Ivanov', iban: 'FR1420041010050500013M02606' },
];

export function findAccount(input: string) {
  const id = input.trim().replace(/^@/, '').toLowerCase();
  return demoAccounts.find((a) => a.wiseId === id);
}
