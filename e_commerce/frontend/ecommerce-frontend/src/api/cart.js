import api from "./axios";

export async function fetchCart() {
  const { data } = await api.get("/cart");
  return data;
}

export async function addToCart(productId, quantity = 1) {
  const { data } = await api.post("/cart", {
    product_id: productId,
    quantity,
  });
  return data;
}

export async function updateCartItem(cartItemId, quantity) {
  const { data } = await api.put(`/cart/${cartItemId}`, null, {
    params: { quantity },
  });
  return data;
}

export async function deleteCartItem(cartItemId) {
  const { data } = await api.delete(`/cart/${cartItemId}`);
  return data;
}
