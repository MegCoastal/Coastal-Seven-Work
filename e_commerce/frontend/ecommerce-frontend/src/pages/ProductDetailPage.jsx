import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchProduct } from "../api/products";
import { useAuth } from "../context/AuthContext";
import { useCartStore } from "../store/cartStore";
import { getErrorMessage } from "../utils/getErrorMessage";
import { getProductVisuals } from "../utils/productDisplay";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await fetchProduct(id);
        setProduct(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    if (qty > product.stock) {
      setError(`Cannot add more than available stock (${product.stock})`);
      return;
    }

    setAdding(true);
    setError("");
    try {
      await addToCart(product.id, qty, isAuthenticated);
      setToast(`Added ${qty} ${qty > 1 ? "items" : "item"} to cart!`);
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon">🌊</div>
          <p>Loading product details...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon">🔎</div>
          <h2>Product not found</h2>
          <Link to="/products" className="btn btn-primary">
            Back to collection
          </Link>
        </div>
      </main>
    );
  }

  const visuals = getProductVisuals(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <main className="page page-enter">
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to="/products" style={{ color: "var(--ocean)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          ← Back to collection
        </Link>
      </div>

      {error && <p className="form-error page-error">{error}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "3rem",
          background: "var(--white)",
          borderRadius: "var(--radius-lg)",
          padding: "2.5rem",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
          alignItems: "center"
        }}
      >
        <div
          style={{
            background: visuals.gradient,
            borderRadius: "var(--radius)",
            aspectRatio: "1/1",
            display: "grid",
            placeItems: "center",
            fontSize: "8rem",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden"
          }}
        >
          {product.image_url ? (
            <img 
              src={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}${product.image_url}`} 
              alt={product.name} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
          ) : (
            visuals.emoji
          )}
        </div>

        <div>
          <span style={{ 
            display: "inline-block", 
            textTransform: "uppercase", 
            fontSize: "0.8rem", 
            fontWeight: 700, 
            color: "var(--teal)", 
            letterSpacing: "0.06em", 
            marginBottom: "0.5rem" 
          }}>
            Fresh Drop
          </span>
          {product.vendor_name && (
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>
              Sold by: <span style={{ color: "var(--ocean)", fontWeight: 700 }}>{product.vendor_name}</span>
            </div>
          )}
          {isAuthenticated && (user?.is_admin || (user?.is_vendor && product.vendor_id === user.id)) && (
            <div style={{ marginBottom: "1rem" }}>
              <Link
                to={`/products/${product.id}/edit`}
                className="btn btn-outline btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                ✏️ Edit Product Details
              </Link>
            </div>
          )}
          <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontFamily: "var(--font-display)" }}>
            {product.name}
          </h1>
          <p style={{ fontSize: "1.80rem", fontWeight: 800, color: "var(--ocean-deep)", marginBottom: "1.5rem", fontFamily: "var(--font-display)" }}>
            Rs.{product.price.toFixed(2)}
          </p>

          <p style={{ color: "var(--text)", lineHeight: 1.7, marginBottom: "2rem" }}>
            {product.description || "No description provided for this premium item. Expertly selected and quality checked for WaveMart."}
          </p>

          <div style={{ marginBottom: "2rem" }}>
            <span
              style={{
                display: "inline-block",
                padding: "0.4rem 1rem",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: 700,
                background: isOutOfStock 
                  ? "rgba(239, 68, 68, 0.1)" 
                  : isLowStock 
                  ? "rgba(249, 115, 22, 0.1)" 
                  : "rgba(20, 184, 166, 0.1)",
                color: isOutOfStock 
                  ? "rgb(239, 68, 68)" 
                  : isLowStock 
                  ? "rgb(249, 115, 22)" 
                  : "rgb(20, 184, 166)",
              }}
            >
              {isOutOfStock 
                ? "🚫 Out of stock" 
                : isLowStock 
                ? `⚠️ Only ${product.stock} items left!` 
                : `✅ In stock: ${product.stock}`}
            </span>
          </div>

          {!isOutOfStock && (
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div className="qty-control" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className="qty-btn"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => q - 1)}
                >
                  -
                </button>
                <span style={{ fontWeight: 600, minWidth: "32px", textAlign: "center" }}>
                  {qty}
                </span>
                <button
                  type="button"
                  className="qty-btn"
                  disabled={qty >= product.stock}
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="btn btn-accent"
                disabled={adding}
                onClick={handleAddToCart}
              >
                {adding ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

export default ProductDetailPage;
