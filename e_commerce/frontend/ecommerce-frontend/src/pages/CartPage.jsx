import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProducts } from "../api/products";
import { useAuth } from "../context/AuthContext";
import { useCartStore } from "../store/cartStore";
import { getErrorMessage } from "../utils/getErrorMessage";
import { getProductVisuals } from "../utils/productDisplay";
import { CartIcon } from "../components/Icons";

function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const updateCartItem = useCartStore((state) => state.updateCartItem);
  const deleteCartItem = useCartStore((state) => state.deleteCartItem);
  const refreshCart = useCartStore((state) => state.fetchCart);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadCart = async () => {
    setLoading(true);
    setError("");
    try {
      const [cartData, products] = await Promise.all([
        refreshCart(isAuthenticated),
        fetchProducts(),
      ]);

      const productMap = new Map(products.map((p) => [p.id, p]));

      const enriched = cartData.grouped
        .map((item) => {
          const product = productMap.get(item.productId);
          if (!product) return null;
          const visuals = getProductVisuals(product.id);
          return {
            ...item,
            name: product.name,
            price: product.price,
            emoji: visuals.emoji,
            gradient: visuals.gradient,
            stock: product.stock,
          };
        })
        .filter(Boolean);

      setItems(enriched);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [isAuthenticated]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleQtyChange = async (productId, lineItemId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId, lineItemId);
      return;
    }

    setUpdatingId(productId);
    setError("");
    try {
      await updateCartItem(lineItemId, newQty, isAuthenticated);
      await loadCart();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId, lineItemId) => {
    setUpdatingId(productId);
    setError("");
    try {
      await deleteCartItem(lineItemId, isAuthenticated);
      await loadCart();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckoutRedirect = () => {
    navigate("/checkout");
  };

  if (loading) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <CartIcon size={48} color="var(--ocean)" />
          </div>
          <p>Loading your cart...</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <CartIcon size={48} color="var(--ocean)" />
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven&apos;t added anything yet.</p>
          <Link to="/products" className="btn btn-primary">
            Start shopping →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page page-enter">
      <h1 style={{ marginBottom: "2rem" }}>Your cart</h1>

      {error && <p className="form-error page-error">{error}</p>}

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item, index) => {
            const lineItemId = item.lineIds[0];
            return (
              <article
                key={item.productId}
                className="cart-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="cart-item-emoji"
                  style={{ background: item.gradient }}
                >
                  {item.emoji}
                </div>
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-meta">
                    Rs.{item.price.toFixed(2)} each · Stock: {item.stock}
                  </p>
                  
                  <div className="qty-control">
                    <button
                      type="button"
                      className="qty-btn"
                      disabled={updatingId === item.productId}
                      onClick={() => handleQtyChange(item.productId, lineItemId, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 600, minWidth: "24px", textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="qty-btn"
                      disabled={updatingId === item.productId || item.quantity >= item.stock}
                      onClick={() => handleQtyChange(item.productId, lineItemId, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ 
                        marginLeft: "1rem", 
                        borderColor: "rgba(239, 68, 68, 0.2)", 
                        color: "rgb(239, 68, 68)",
                        padding: "0.25rem 0.75rem",
                        fontSize: "0.75rem"
                      }}
                      disabled={updatingId === item.productId}
                      onClick={() => handleRemoveItem(item.productId, lineItemId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="cart-item-price">
                  Rs.{(item.price * item.quantity).toFixed(2)}
                </p>
              </article>
            );
          })}
        </div>

        <aside className="cart-summary">
          <h3>Order summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>Rs.{subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : `Rs.${shipping.toFixed(2)}`}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>Rs.{total.toFixed(2)}</span>
          </div>
          <button
            type="button"
            className="btn btn-accent"
            onClick={handleCheckoutRedirect}
          >
            Checkout →
          </button>
        </aside>
      </div>
    </main>
  );
}

export default CartPage;
