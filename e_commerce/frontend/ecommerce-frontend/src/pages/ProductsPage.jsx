import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { SearchIcon, ShoppingBagIcon } from "../components/Icons";
import { fetchProducts } from "../api/products";
import { useAuth } from "../context/AuthContext";
import { useCartStore } from "../store/cartStore";
import { getErrorMessage } from "../utils/getErrorMessage";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("name");
  
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState("");
  const { isAuthenticated } = useAuth();
  const addToCart = useCartStore((state) => state.addToCart);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [localSearch, setLocalSearch] = useState("");

  // Sync URL query params to state
  useEffect(() => {
    setCategory(searchParams.get("category") || "");
    const currentSearch = searchParams.get("search") || "";
    setSearch(currentSearch);
    setLocalSearch(currentSearch);
  }, [searchParams]);

  // Debounce local search input value to the URL query param
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== (searchParams.get("search") || "")) {
        updateQueryParam("search", localSearch);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const updateQueryParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  // Load products with query parameter filters
  useEffect(() => {
    let cancelled = false;

    async function loadFilteredProducts() {
      setLoading(true);
      setError("");

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (minPrice) params.min_price = parseFloat(minPrice);
      if (maxPrice) params.max_price = parseFloat(maxPrice);

      try {
        const data = await fetchProducts(params);
        if (!cancelled) setProducts(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Debounce filter inputs to avoid over-fetching
    const handler = setTimeout(() => {
      loadFilteredProducts();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [search, category, minPrice, maxPrice]);

  // Sort products client-side
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, sortBy]);

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/products" } });
      return;
    }

    setAddingId(product.id);
    try {
      await addToCart(product.id, 1, isAuthenticated);
      setToast(`${product.name} added to cart!`);
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddingId(null);
    }
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("name");
    setSearchParams(new URLSearchParams());
  };

  return (
    <main className="page page-enter">
      <div className="section-header" style={{ textAlign: "left", marginBottom: "2rem" }}>
        <h1>WaveMart Catalog</h1>
        <p>Browse our curated collection of electronics, clothing, home items, books, and fitness gear</p>
      </div>

      {error && <p className="form-error page-error">{error}</p>}

      {/* Main Filter Setup */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem", alignItems: "start" }}>
        
        {/* Left Column: Sidebar Filters */}
        <aside
          style={{
            background: "var(--white)",
            padding: "1.5rem",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}
        >
          {/* Keyword Search */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600, fontSize: "0.9rem" }} htmlFor="search-input">Search catalog</label>
            <div className="search-box" style={{ width: "100%", display: "flex", alignItems: "center" }}>
              <SearchIcon size={18} color="var(--text-muted)" style={{ marginRight: "0.5rem", flexShrink: 0 }} />
              <input
                id="search-input"
                type="search"
                placeholder="Keywords..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <strong style={{ fontWeight: 600, fontSize: "0.9rem" }}>Category</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {["", "Electronics", "Clothing", "Home & Kitchen", "Books", "Fitness"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => updateQueryParam("category", cat)}
                  style={{
                    textAlign: "left",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    border: "none",
                    background: category === cat ? "rgba(14, 165, 233, 0.08)" : "none",
                    color: category === cat ? "var(--ocean-deep)" : "var(--text)",
                    fontWeight: category === cat ? 700 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  {cat === "" ? (
                    <>
                      <ShoppingBagIcon size={15} color={category === "" ? "var(--ocean-deep)" : "var(--text)"} />
                      <span>All Categories</span>
                    </>
                  ) : (
                    <span>{cat}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <strong style={{ fontWeight: 600, fontSize: "0.9rem" }}>Price Range (Rs.)</strong>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number"
                placeholder="Min"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontSize: "0.85rem"
                }}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontSize: "0.85rem"
                }}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Reset Action */}
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: "100%", fontSize: "0.85rem", padding: "0.6rem" }}
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </aside>

        {/* Right Column: Grid and Results */}
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Toolbar showing result counts and sorting */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Showing {sortedProducts.length} results
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label htmlFor="sort-select" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Sort by</label>
              <select
                id="sort-select"
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--white)",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Alphabetical</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Catalog State Render */}
          {loading && products.length === 0 ? (
            <div className="empty-state">
              <p>Refreshing list...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="empty-state" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
              <div className="empty-icon">🔎</div>
              <h2>No items found</h2>
              <p>Try resetting the price parameters or changing categories.</p>
            </div>
          ) : (
            <div className="products-grid">
              {sortedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  style={{ animationDelay: `${index * 0.04}s` }}
                  onAddToCart={handleAddToCart}
                  isAdding={addingId === product.id}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

export default ProductsPage;
