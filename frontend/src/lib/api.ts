// Shared transport only. Keep feature endpoints and types inside features/<name>.
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}
