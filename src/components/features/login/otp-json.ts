export function readJson(
  res: Response
): Promise<Record<string, unknown> | null> {
  return res
    .json()
    .then((data) => data as Record<string, unknown>)
    .catch(() => null);
}
