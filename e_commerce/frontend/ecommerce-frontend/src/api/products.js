import api from "./axios";

export async function fetchProducts(params = {}) {
  const { data } = await api.get("/products", { params });
  return data;
}

export async function fetchProduct(productId) {
  const { data } = await api.get(`/products/${productId}`);
  return data;
}

export async function createProduct(productData) {
  const { data } = await api.post("/products", productData);
  return data;
}

export async function updateProduct(productId, productData) {
  const { data } = await api.put(`/products/${productId}`, productData);
  return data;
}

export async function uploadProductImage(formData) {
  const { data } = await api.post("/products/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function deleteProduct(productId) {
  const { data } = await api.delete(`/products/${productId}`);
  return data;
}
