import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOrders, fetchOrder } from "../api/orders";
import { getErrorMessage } from "../utils/getErrorMessage";
import { PackageIcon } from "../components/Icons";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const reloadOrdersList = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await fetchOrders();
        setOrders(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  // WebSocket Connection
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsProtocol = apiBase.startsWith("https") ? "wss" : "ws";
    const wsHost = apiBase.replace(/^https?:\/\//, "");
    const wsUrl = `${wsProtocol}://${wsHost}/ws/orders?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          setToastMessage(data.message);
          setTimeout(() => setToastMessage(""), 5000);
          
          // Reload orders to reflect status changes in list
          reloadOrdersList();
        }
      } catch (err) {
        console.error("Failed to parse socket message:", err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleToggleExpand = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);

    if (!orderDetails[orderId]) {
      setDetailsLoading(true);
      try {
        const details = await fetchOrder(orderId);
        setOrderDetails((prev) => ({
          ...prev,
          [orderId]: details,
        }));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <PackageIcon size={48} color="var(--ocean)" />
          </div>
          <p>Loading your orders...</p>
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <PackageIcon size={48} color="var(--ocean)" />
          </div>
          <h2>No orders yet</h2>
          <p>You haven&apos;t placed any orders yet. Start shopping!</p>
          <Link to="/products" className="btn btn-primary">
            Start shopping →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page page-enter">
      <div className="section-header" style={{ textAlign: "left", marginBottom: "2rem" }}>
        <h1>Order History</h1>
        <p>Manage and track your recent orders</p>
      </div>

      {error && <p className="form-error page-error">{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {orders.map((order, index) => {
          const isExpanded = expandedOrderId === order.id;
          const details = orderDetails[order.id];

          return (
            <article
              key={order.id}
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
                animationDelay: `${index * 0.08}s`,
                animation: "fadeUp 0.6s ease backwards",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", color: "var(--text-h)" }}>
                    Order #{order.id}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    Status: <strong style={{ color: order.status === "Pending" ? "var(--coral)" : "var(--teal)" }}>{order.status}</strong>
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ocean-deep)", fontFamily: "var(--font-display)" }}>
                    Rs.{order.total_amount.toFixed(2)}
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: "0.5rem" }}
                    onClick={() => handleToggleExpand(order.id)}
                  >
                    {isExpanded ? "Hide items" : "Show items"}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div
                  style={{
                    marginTop: "1.5rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid var(--border)",
                    animation: "fadeIn 0.3s ease",
                  }}
                >
                  {detailsLoading && !details ? (
                    <p style={{ color: "var(--text-muted)" }}>Loading item details...</p>
                  ) : details ? (
                    <div>
                      <h4 style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>Ordered Items</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {details.items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.9rem",
                              padding: "0.5rem 0",
                              borderBottom: "1px dashed rgba(14, 165, 233, 0.1)",
                            }}
                          >
                            <div>
                              <p style={{ fontWeight: 600, color: "var(--text-h)" }}>
                                {item.product_name || `Product ID: ${item.product_id}`}
                              </p>
                              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                Qty: {item.quantity} · Rs.{item.price.toFixed(2)} each
                              </p>
                            </div>
                            <p style={{ fontWeight: 600, color: "var(--ocean-deep)" }}>
                              Rs.{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: "var(--text-muted)" }}>Failed to load order items.</p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {toastMessage && (
        <div 
          className="toast" 
          style={{ 
            position: "fixed", 
            bottom: "2rem", 
            right: "2rem", 
            background: "var(--gradient-accent)", 
            color: "white", 
            zIndex: 1000,
            padding: "1rem 1.5rem",
            borderRadius: "12px",
            boxShadow: "var(--shadow-lg)"
          }}
        >
          <span>Notice: {toastMessage}</span>
        </div>
      )}
    </main>
  );
}

export default OrdersPage;
