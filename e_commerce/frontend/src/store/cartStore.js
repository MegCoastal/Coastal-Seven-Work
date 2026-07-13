import { create } from "zustand";
import { 
  fetchCart as fetchCartApi, 
  addToCart as addToCartApi, 
  updateCartItem as updateCartItemApi, 
  deleteCartItem as deleteCartItemApi 
} from "../api/cart";

function groupCartItems(items) {
  const grouped = new Map();
  for (const item of items) {
    const existing = grouped.get(item.product_id);
    if (existing) {
      existing.quantity += item.quantity;
      existing.lineIds.push(item.id);
    } else {
      grouped.set(item.product_id, {
        productId: item.product_id,
        quantity: item.quantity,
        lineIds: [item.id],
      });
    }
  }
  return Array.from(grouped.values());
}

export const useCartStore = create((set, get) => ({
  cartItems: [],
  groupedItems: [],
  cartCount: 0,
  loading: false,
  error: null,

  fetchCart: async (isAuthenticated) => {
    if (!isAuthenticated) {
      set({ cartItems: [], groupedItems: [], cartCount: 0 });
      return { raw: [], grouped: [] };
    }
    set({ loading: true, error: null });
    try {
      const items = await fetchCartApi();
      const grouped = groupCartItems(items);
      const count = grouped.reduce((sum, item) => sum + item.quantity, 0);
      set({ cartItems: items, groupedItems: grouped, cartCount: count, loading: false });
      return { raw: items, grouped };
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  addToCart: async (productId, quantity = 1, isAuthenticated) => {
    if (!isAuthenticated) return;
    set({ loading: true, error: null });
    try {
      await addToCartApi(productId, quantity);
      await get().fetchCart(isAuthenticated);
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateCartItem: async (cartItemId, quantity, isAuthenticated) => {
    if (!isAuthenticated) return;
    set({ loading: true, error: null });
    try {
      await updateCartItemApi(cartItemId, quantity);
      await get().fetchCart(isAuthenticated);
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteCartItem: async (cartItemId, isAuthenticated) => {
    if (!isAuthenticated) return;
    set({ loading: true, error: null });
    try {
      await deleteCartItemApi(cartItemId);
      await get().fetchCart(isAuthenticated);
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  clearCart: () => {
    set({ cartItems: [], groupedItems: [], cartCount: 0 });
  }
}));
