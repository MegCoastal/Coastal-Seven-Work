import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProducts } from "../api/products";
import { createOrder } from "../api/orders";
import { useAuth } from "../context/AuthContext";
import { useCartStore } from "../store/cartStore";
import { getErrorMessage } from "../utils/getErrorMessage";
import { getProductVisuals } from "../utils/productDisplay";

function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const groupedItems = useCartStore((state) => state.groupedItems);
  const refreshCart = useCartStore((state) => state.fetchCart);
  const clearCart = useCartStore((state) => state.clearCart);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Form Fields
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  const loadCartSummary = async () => {
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
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    loadCartSummary();
  }, [isAuthenticated]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!address.trim()) {
      setError("Shipping address is required.");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        shipping_address: address,
        shipping_phone: phone,
        payment_method: paymentMethod,
      });
      setOrderSuccess(order);
      clearCart();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>Preparing checkout details...</p>
        </div>
      </main>
    );
  }

  if (orderSuccess) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h2>Checkout Successful!</h2>
          <p>
            Order #{orderSuccess.id} has been placed for Rs.{orderSuccess.total_amount.toFixed(2)}.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Payment via: <strong>{orderSuccess.payment_method}</strong> | Shipping to: <i>{orderSuccess.shipping_address}</i>
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link to="/orders" className="btn btn-outline">
              View Order History
            </Link>
            <Link to="/products" className="btn btn-primary">
              Continue Shopping →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h2>Checkout is empty</h2>
          <p>Add products to your cart before checking out.</p>
          <Link to="/products" className="btn btn-primary">
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page page-enter">
      <h1 style={{ marginBottom: "2rem" }}>Checkout</h1>

      {error && <p className="form-error page-error">{error}</p>}

      <div className="cart-layout">
        <div>
          <form onSubmit={handleSubmit} className="auth-card" style={{ maxWidth: "100%", background: "var(--white)", padding: "2rem" }}>
            <h2>Shipping & Payment Details</h2>
            
            <div className="form-group" style={{ marginTop: "1.5rem" }}>
              <label htmlFor="shipping-address">Delivery Address</label>
              <textarea
                id="shipping-address"
                required
                style={{
                  width: "100%",
                  padding: "0.85rem 1.1rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font)",
                  fontSize: "1rem"
                }}
                rows="4"
                placeholder="Enter your complete street name, city, state, and ZIP code..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label htmlFor="shipping-phone">Phone Number</label>
              <input
                id="shipping-phone"
                type="tel"
                required
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label htmlFor="payment-method">Payment Method</label>
              <select
                id="payment-method"
                style={{
                  width: "100%",
                  padding: "0.85rem 1.1rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font)",
                  fontSize: "1rem",
                  background: "var(--white)"
                }}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="UPI / Wallet">UPI / Digital Wallet</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "1.5rem" }}
              disabled={submitting}
            >
              {submitting ? "Placing Order..." : "Confirm & Pay"}
            </button>
          </form>
        </div>

        <aside className="cart-summary">
          <h3>Items Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "200px", overflowY: "auto", marginBottom: "1.5rem", paddingRight: "0.25rem" }}>
            {items.map((item) => (
              <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", opacity: 0.95 }}>
                <span>{item.name} (x{item.quantity})</span>
                <span>Rs.{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
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
        </aside>
      </div>
    </main>
  );
}

export default CheckoutPage;
