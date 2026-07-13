import api from "./axios";

export async function createOrder(checkoutData) {
  const { data } = await api.post("/orders", checkoutData);
  return data;
}

export async function fetchOrders() {
  const { data } = await api.get("/orders");
  return data;
}

export async function fetchOrder(orderId) {
  const { data } = await api.get(`/orders/${orderId}`);
  return data;
}

export async function fetchAllOrdersAdmin() {
  const { data } = await api.get("/orders/all");
  return data;
}

export async function updateOrderStatus(orderId, status) {
  const { data } = await api.patch(`/orders/${orderId}`, { status });
  return data;
}
