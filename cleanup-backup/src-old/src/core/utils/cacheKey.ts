export function createCacheKey(values: Record<string, string | number | undefined | readonly number[]>) {
  return Object.entries(values)
    .filter((entry): entry is [string, string | number | readonly number[]] => entry[1] !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(Array.isArray(value) ? [...value].sort((a, b) => a - b).join(',') : String(value))}`)
    .join('&');
}
