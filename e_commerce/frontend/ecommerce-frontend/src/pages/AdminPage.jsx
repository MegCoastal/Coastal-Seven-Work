import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  fetchProducts, 
  createProduct, 
  updateProduct, 
  uploadProductImage,
  deleteProduct 
} from "../api/products";
import { fetchAllOrdersAdmin, updateOrderStatus } from "../api/orders";
import { getErrorMessage } from "../utils/getErrorMessage";
import { useAuth } from "../context/AuthContext";

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Product Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  if (authLoading) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <p>Loading user profile...</p>
        </div>
      </main>
    );
  }

  if (!user?.is_admin && !user?.is_vendor) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon">🚫</div>
          <h2>Access denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </main>
    );
  }

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (activeTab === "products") {
        const params = {};
        if (user?.is_vendor && !user?.is_admin) {
          params.vendor_id = user.id;
        }
        const prodData = await fetchProducts(params);
        setProducts(prodData);
      } else {
        const ordData = await fetchAllOrdersAdmin();
        setOrders(ordData);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setImageFile(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", parseFloat(price));
      formData.append("stock", parseInt(stock, 10));
      if (imageFile) {
        formData.append("image", imageFile);
      }
      await createProduct(formData);
      setSuccess("Product created successfully!");
      setShowForm(false);
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setError("");
    setSuccess("");
    try {
      await deleteProduct(productId);
      setSuccess("Product deleted successfully!");
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setError("");
    setSuccess("");
    try {
      await updateOrderStatus(orderId, newStatus);
      setSuccess(`Order #${orderId} status updated to ${newStatus}`);
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <main className="page page-enter">
      <div className="section-header" style={{ textAlign: "left", marginBottom: "2rem" }}>
        <h1>{user?.is_admin ? "Admin Control Panel" : "Vendor Control Panel"}</h1>
        <p>{user?.is_admin ? "Manage product inventories and customer orders" : "Manage your product catalog"}</p>
      </div>
 
      {/* Tabs */}
      {user?.is_admin && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
          <button
            type="button"
            className={`btn ${activeTab === "products" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("products")}
          >
            📦 Inventory Management
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "orders" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("orders")}
          >
            🧾 Customer Orders
          </button>
        </div>
      )}

      {error && <p className="form-error page-error">{error}</p>}
      {success && <p className="toast" style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000 }}>{success}</p>}

      {/* Loading state */}
      {loading ? (
        <div className="empty-state">
          <p>Loading administration data...</p>
        </div>
      ) : activeTab === "products" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2>Product Catalog</h2>
            {!showForm && (
              <button type="button" className="btn btn-accent" onClick={handleOpenAddForm}>
                + Add Product
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <form
              onSubmit={handleProductSubmit}
              className="auth-card"
              style={{ maxWidth: "100%", marginBottom: "2rem", background: "var(--white)", padding: "2rem" }}
            >
              <h3>Create New Product</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                <div className="form-group">
                  <label htmlFor="prod-name">Name</label>
                  <input
                    id="prod-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prod-price">Price (Rs.)</label>
                  <input
                    id="prod-price"
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prod-stock">Stock Level</label>
                  <input
                    id="prod-stock"
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label htmlFor="prod-desc">Description</label>
                <textarea
                  id="prod-desc"
                  style={{
                    width: "100%",
                    padding: "0.85rem 1.1rem",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font)",
                    fontSize: "1rem"
                  }}
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label htmlFor="prod-image">Product Image File</label>
                <input
                  id="prod-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--white)"
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-accent" disabled={formSubmitting}>
                  {formSubmitting ? "Saving..." : "Create Product"}
                </button>
                <button type="button" className="btn btn-outline" onClick={handleCloseForm}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {products.length === 0 ? (
            <div className="empty-state">
              <p>No products found in catalog. Create one to get started.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--white)", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
                <thead>
                  <tr style={{ background: "rgba(14, 165, 233, 0.05)", textAlign: "left" }}>
                    <th style={{ padding: "1rem" }}>ID</th>
                    <th style={{ padding: "1rem" }}>Name</th>
                    <th style={{ padding: "1rem" }}>Price</th>
                    <th style={{ padding: "1rem" }}>Stock</th>
                    <th style={{ padding: "1rem" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem" }}>{p.id}</td>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: "1rem" }}>Rs.{p.price.toFixed(2)}</td>
                      <td style={{ padding: "1rem" }}>{p.stock}</td>
                      <td style={{ padding: "1rem", display: "flex", gap: "0.5rem" }}>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(`/products/${p.id}/edit`)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: "rgba(239, 68, 68, 0.2)", color: "rgb(239, 68, 68)" }}
                          onClick={() => handleDeleteProduct(p.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2>All Customer Orders</h2>
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>No customer orders placed yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--white)", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
                <thead>
                  <tr style={{ background: "rgba(14, 165, 233, 0.05)", textAlign: "left" }}>
                    <th style={{ padding: "1rem" }}>Order ID</th>
                    <th style={{ padding: "1rem" }}>User ID</th>
                    <th style={{ padding: "1rem" }}>Total Amount</th>
                    <th style={{ padding: "1rem" }}>Status</th>
                    <th style={{ padding: "1rem" }}>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem" }}>#{o.id}</td>
                      <td style={{ padding: "1rem" }}>Customer {o.user_id}</td>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>Rs.{o.total_amount.toFixed(2)}</td>
                      <td style={{ padding: "1rem" }}>
                        <strong style={{ color: o.status === "Pending" ? "var(--coral)" : "var(--teal)" }}>
                          {o.status}
                        </strong>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            fontFamily: "var(--font)",
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default AdminPage;
