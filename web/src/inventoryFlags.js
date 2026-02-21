/**
 * Shared synchronous flags for inventory/menu pointer lock coordination.
 * Using a plain JS object avoids React state batching delays.
 */
export const inventoryFlags = {
    suppressNextMenuOpen: false
}
