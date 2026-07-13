import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProduct, updateProduct, uploadProductImage } from "../api/products";
import { getErrorMessage } from "../utils/getErrorMessage";
import { useAuth } from "../context/AuthContext";

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError("");
      try {
        const prod = await fetchProduct(id);
        if (!user?.is_admin && prod.vendor_id !== user?.id) {
          setError("Access denied: You do not have permission to edit this product.");
          setAuthorized(false);
        } else {
          setName(prod.name);
          setDescription(prod.description || "");
          setPrice(prod.price.toString());
          setStock(prod.stock.toString());
          setCategory(prod.category || "");
          setAuthorized(true);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadProduct();
    } else if (!authLoading && !user) {
      setError("Please sign in to access this page.");
      setAuthorized(false);
      setLoading(false);
    }
  }, [id, user, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category,
      };

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await uploadProductImage(formData);
        payload.image_url = uploadRes.image_url;
      }

      await updateProduct(id, payload);
      setSuccess("Product updated successfully!");
      setTimeout(() => {
        navigate(`/products/${id}`);
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <p>Loading details...</p>
        </div>
      </main>
    );
  }

  if (error && !authorized) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button type="button" className="btn btn-outline" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page page-enter">
      <div className="section-header" style={{ textAlign: "left", marginBottom: "2rem" }}>
        <h1>Edit Product Details</h1>
        <p>Modify metadata and upload a new visual asset for Product #{id}</p>
      </div>

      {error && <p className="form-error page-error">{error}</p>}
      {success && <p className="toast" style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000 }}>{success}</p>}

      <form
        onSubmit={handleSubmit}
        className="auth-card"
        style={{ maxWidth: "800px", margin: "0 auto", background: "var(--white)", padding: "2.5rem", borderRadius: "16px", border: "1px solid var(--border)" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          <div className="form-group">
            <label htmlFor="prod-name">Product Name</label>
            <input
              id="prod-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-category">Category</label>
            <select
              id="prod-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "0.85rem 1.1rem",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "var(--white)",
                fontFamily: "var(--font)",
                fontSize: "1rem"
              }}
            >
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Home & Kitchen">Home & Kitchen</option>
              <option value="Books">Books</option>
              <option value="Fitness">Fitness</option>
            </select>
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

        <div className="form-group" style={{ marginTop: "1.5rem" }}>
          <label htmlFor="prod-desc">Description (Optional - Empty triggers AI description writer)</label>
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
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginTop: "1.5rem" }}>
          <label htmlFor="prod-image">Product Image File (Optional - Leave empty to keep current)</label>
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

        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
          <button type="submit" className="btn btn-accent" disabled={formSubmitting}>
            {formSubmitting ? "Saving Changes..." : "Save Changes"}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(`/products/${id}`)}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

export default EditProductPage;
