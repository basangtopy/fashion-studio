// ─── Shared stock status calculation ────────────────────────────────────────
// Centralises the threshold logic so all order and cart flows use
// the same definition of IN_STOCK / LOW_STOCK / OUT_OF_STOCK.

export const getStockStatus = (count) => {
    if (count <= 0) return "OUT_OF_STOCK";
    if (count <= 10) return "LOW_STOCK";
    return "IN_STOCK";
};
