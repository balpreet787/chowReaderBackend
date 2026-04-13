export function toIsoString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function toNullableIsoString(
  value: Date | string | null
): string | null {
  return value ? toIsoString(value) : null;
}
