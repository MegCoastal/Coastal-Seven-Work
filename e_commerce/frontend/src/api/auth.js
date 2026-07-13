import api, { TOKEN_KEY } from "./axios";

export async function registerUser({ username, email, password, is_vendor }) {
  const { data } = await api.post("/users", {
    username,
    email,
    password,
    is_vendor,
  });
  return data;
}

export async function loginUser({ email, password }) {
  const { data } = await api.post("/users/login", { email, password });
  localStorage.setItem(TOKEN_KEY, data.access_token);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/users/me");
  return data;
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
}
