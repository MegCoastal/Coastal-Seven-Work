export function getErrorMessage(error) {
  const detail = error.response?.data?.detail;

  if (!detail) {
    return error.message || "Something went wrong";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || String(item)).join(", ");
  }

  return "Something went wrong";
}
