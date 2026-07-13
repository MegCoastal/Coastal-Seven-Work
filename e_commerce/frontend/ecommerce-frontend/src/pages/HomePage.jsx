import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="page page-enter">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">✨ Summer collection is live</span>
          <h1>Wave Mart Store</h1>
          <p>
            Discover curated electronics, clothing, home essentials, books,
            and fitness gear. High quality items, shipped fast.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-accent">
              Explore products →
            </Link>
            <Link to="/register" className="btn btn-outline">
              Join for 10% off
            </Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true" style={{ fontSize: "5rem", textAlign: "center" }}>
          🛍️
        </div>
      </section>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">🚚</div>
          <p className="stat-value">Free</p>
          <p className="stat-label">Shipping over Rs.50</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <p className="stat-value">4.9</p>
          <p className="stat-label">Customer rating</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌱</div>
          <p className="stat-value">100%</p>
          <p className="stat-label">Eco-friendly packaging</p>
        </div>
      </div>

      <section className="section">
        <div className="section-header">
          <h2>Why Wave Mart?</h2>
          <p>Everything you need in one place</p>
        </div>
        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-icon blue">📦</div>
            <h3>Premium design</h3>
            <p>
              Every product is curated with premium aesthetics — sleek form,
              reliable function, and a modern feel.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon teal">♻️</div>
            <h3>Sustainably sourced</h3>
            <p>
              We partner with ethical suppliers and use recyclable packaging
              on every order.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon coral">⚡</div>
            <h3>Fast & secure checkout</h3>
            <p>
              Smooth shopping experience with secure payments and quick
              delivery to your door.
            </p>
          </article>
        </div>
      </section>

      <section className="section" style={{ textAlign: "center" }}>
        <h2>Ready to get started?</h2>
        <p style={{ color: "var(--text-muted)", margin: "0.75rem 0 1.5rem" }}>
          Browse our latest collections and find exactly what you need.
        </p>
        <Link to="/products" className="btn btn-primary">
          Shop now →
        </Link>
      </section>
    </main>
  );
}

export default HomePage;
