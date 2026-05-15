export function normalizeShoppingItemName(input: string) {
  return input
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ");
}
