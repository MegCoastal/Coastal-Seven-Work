import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCartStore } from "../store/cartStore";
import { 
  LogoIcon, CartIcon, UserIcon, SettingsIcon, SunIcon, MoonIcon, 
  HelpIcon, TruckIcon, LogoutIcon, AwardIcon, SearchIcon, MenuIcon, 
  ShieldIcon, PackageIcon, SparklesIcon, ChatIcon, ShoppingBagIcon, AIAssistantIcon 
} from "./Icons";
import { useUIStore } from "../store/uiStore";

function Navbar() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const cartCount = useCartStore((state) => state.cartCount);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const openDrawer = useUIStore((state) => state.openDrawer);
  const navigate = useNavigate();

  const [searchVal, setSearchVal] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  };

  const [recs, setRecs] = useState("");
  const [recsLoading, setRecsLoading] = useState(false);

  useEffect(() => {
    if (isDrawerOpen && isAuthenticated) {
      setRecsLoading(true);
      fetch("http://localhost:8000/products/recommendations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setRecs(data.recommendations || "");
        })
        .catch((err) => console.error(err))
        .finally(() => setRecsLoading(false));
    }
  }, [isDrawerOpen, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchCart(isAuthenticated).catch(() => {});
    }
  }, [isAuthenticated, authLoading, fetchCart]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
    }
  };

  const handleLogout = () => {
    logout();
    clearCart();
    setIsDrawerOpen(false);
    navigate("/");
  };

  return (
    <>
      <header className="header-container">
        <nav className="nav-myntra">
          {/* Logo */}
          <Link to="/" className="nav-myntra-logo" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LogoIcon size={24} style={{ color: "var(--ocean)" }} />
            <strong>WAVEMART</strong>
          </Link>

          {/* Department Categories (Inspired by Myntra hover lists) */}
          <ul className="nav-depts">
            <li className="nav-dept-item">
              <Link to="/products?category=Electronics" className="nav-dept-link">
                Electronics
              </Link>
              <div className="nav-mega-dropdown">
                <Link to="/products?category=Electronics" className="dropdown-item-link">Headphones</Link>
                <Link to="/products?category=Electronics" className="dropdown-item-link">Fast Chargers</Link>
                <Link to="/products?category=Electronics" className="dropdown-item-link">Keyboards & Mice</Link>
                <Link to="/products?category=Electronics" className="dropdown-item-link">Smartwatches</Link>
              </div>
            </li>
            <li className="nav-dept-item">
              <Link to="/products?category=Clothing" className="nav-dept-link">
                Clothing
              </Link>
              <div className="nav-mega-dropdown">
                <Link to="/products?category=Clothing" className="dropdown-item-link">T-Shirts</Link>
                <Link to="/products?category=Clothing" className="dropdown-item-link">Denim Jeans</Link>
                <Link to="/products?category=Clothing" className="dropdown-item-link">Hoodies</Link>
                <Link to="/products?category=Clothing" className="dropdown-item-link">Sneakers & Socks</Link>
              </div>
            </li>
            <li className="nav-dept-item">
              <Link to="/products?category=Home%20%26%20Kitchen" className="nav-dept-link">
                Home & Kitchen
              </Link>
              <div className="nav-mega-dropdown">
                <Link to="/products?category=Home%20%26%20Kitchen" className="dropdown-item-link">Water Bottles</Link>
                <Link to="/products?category=Home%20%26%20Kitchen" className="dropdown-item-link">Coffee Grinders</Link>
                <Link to="/products?category=Home%20%26%20Kitchen" className="dropdown-item-link">Kitchen Scales</Link>
                <Link to="/products?category=Home%20%26%20Kitchen" className="dropdown-item-link">Storage Pots</Link>
              </div>
            </li>
            <li className="nav-dept-item">
              <Link to="/products?category=Books" className="nav-dept-link">
                Books
              </Link>
              <div className="nav-mega-dropdown">
                <Link to="/products?category=Books" className="dropdown-item-link">Self-Help</Link>
                <Link to="/products?category=Books" className="dropdown-item-link">Sci-Fi & Fantasy</Link>
                <Link to="/products?category=Books" className="dropdown-item-link">Programming</Link>
                <Link to="/products?category=Books" className="dropdown-item-link">Cookbooks</Link>
              </div>
            </li>
            <li className="nav-dept-item">
              <Link to="/products?category=Fitness" className="nav-dept-link">
                Fitness
              </Link>
              <div className="nav-mega-dropdown">
                <Link to="/products?category=Fitness" className="dropdown-item-link">Yoga Mats</Link>
                <Link to="/products?category=Fitness" className="dropdown-item-link">Dumbbells</Link>
                <Link to="/products?category=Fitness" className="dropdown-item-link">Jump Ropes</Link>
                <Link to="/products?category=Fitness" className="dropdown-item-link">Body Fat Scales</Link>
              </div>
            </li>
          </ul>

          {/* Embedded Search input inside navbar */}
          <form onSubmit={handleSearchSubmit} className="nav-search-container">
            <SearchIcon size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search catalog products..."
              className="nav-search-input"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </form>

          {/* Action icons right */}
          <ul className="nav-actions">
            {/* Direct Shop button */}
            <li className="nav-action-item">
              <Link to="/products" className="nav-dept-link" style={{ fontSize: "0.85rem", padding: "0 0.5rem" }}>
                Shop
              </Link>
            </li>

            {/* Shopping Cart count */}
            <li className="nav-action-item">
              <button
                type="button"
                className="nav-icon-btn"
                onClick={() => navigate("/cart")}
                aria-label="View Shopping Bag"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <CartIcon size={20} />
                {isAuthenticated && cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </button>
            </li>


            {/* Persistent Hamburger Drawer Trigger */}
            <li className="nav-action-item">
              <button
                type="button"
                className="nav-icon-btn"
                onClick={() => setIsDrawerOpen(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Open Account Menu"
              >
                <MenuIcon size={22} />
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Persistent Slide-Out Sidebar Drawer */}
      {isDrawerOpen && (
        <>
          {/* Backdrop Overlay */}
          <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />

          {/* Sidebar Panel */}
          <div className="drawer-content">
            <div className="drawer-header">
              <h3>Menu Settings</h3>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              {/* User profile header card */}
              {isAuthenticated ? (
                <div className="drawer-profile-card">
                  <div className="drawer-avatar">
                    {user?.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="drawer-profile-info">
                    <span className="drawer-profile-name">Hi, {user?.username}</span>
                    <span className="drawer-profile-email">{user?.email}</span>
                  </div>
                </div>
              ) : (
                <div className="drawer-profile-card" style={{ background: "rgba(20, 184, 166, 0.05)" }}>
                  <div className="drawer-avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <UserIcon size={20} style={{ color: "var(--ocean)" }} />
                  </div>
                  <div className="drawer-profile-info">
                    <span className="drawer-profile-name">Welcome Guest</span>
                    <Link
                      to="/login"
                      onClick={() => setIsDrawerOpen(false)}
                      style={{ fontSize: "0.85rem", color: "var(--ocean)", fontWeight: 700 }}
                    >
                      Login / Sign Up
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation Links section */}
              <div className="drawer-section">
                <span className="drawer-section-title">Shop Options</span>
                <Link to="/products" className="drawer-menu-item" onClick={() => setIsDrawerOpen(false)}>
                  <span className="drawer-menu-icon" style={{ display: "flex" }}><ShoppingBagIcon size={18} style={{ color: "var(--ocean)" }} /></span> Product Catalog
                </Link>
                <Link to="/cart" className="drawer-menu-item" onClick={() => setIsDrawerOpen(false)}>
                  <span className="drawer-menu-icon" style={{ display: "flex" }}><CartIcon size={18} style={{ color: "var(--ocean)" }} /></span> View Shopping Cart
                </Link>
                {isAuthenticated && (
                  <Link to="/orders" className="drawer-menu-item" onClick={() => setIsDrawerOpen(false)}>
                    <span className="drawer-menu-icon" style={{ display: "flex" }}><PackageIcon size={18} style={{ color: "var(--ocean)" }} /></span> Order History
                  </Link>
                )}
                {isAuthenticated && user?.is_admin && (
                  <>
                    <Link to="/admin" className="drawer-menu-item" onClick={() => setIsDrawerOpen(false)}>
                      <span className="drawer-menu-icon" style={{ display: "flex" }}><ShieldIcon size={18} style={{ color: "var(--ocean)" }} /></span> Admin Dashboard
                    </Link>
                    <Link to="/admin/chat" className="drawer-menu-item" onClick={() => setIsDrawerOpen(false)}>
                      <span className="drawer-menu-icon" style={{ display: "flex" }}><ChatIcon size={18} style={{ color: "var(--ocean)" }} /></span> Admin Support Console
                    </Link>
                  </>
                )}
                {isAuthenticated && user?.is_vendor && !user?.is_admin && (
                  <Link to="/admin" className="drawer-menu-item" onClick={() => setIsDrawerOpen(false)}>
                    <span className="drawer-menu-icon" style={{ display: "flex" }}><ShieldIcon size={18} style={{ color: "var(--ocean)" }} /></span> Vendor Dashboard
                  </Link>
                )}
              </div>

              {/* Settings / Profile Section */}
              <div className="drawer-section">
                <span className="drawer-section-title">Account Details</span>
                <div className="drawer-menu-item" onClick={toggleTheme}>
                  <span className="drawer-menu-icon" style={{ display: "flex" }}>
                    {theme === "light" ? <MoonIcon size={18} style={{ color: "var(--ocean)" }} /> : <SunIcon size={18} style={{ color: "var(--ocean)" }} />}
                  </span>
                  Theme: {theme === "light" ? "Dark Mode" : "Light Mode"}
                </div>
                <div className="drawer-menu-item" onClick={() => alert("Settings module is coming soon!")}>
                  <span className="drawer-menu-icon" style={{ display: "flex" }}><SettingsIcon size={18} style={{ color: "var(--ocean)" }} /></span> Profile Settings
                </div>
                <div className="drawer-menu-item" onClick={() => alert("Surf coins dashboard coming soon!")}>
                  <span className="drawer-menu-icon" style={{ display: "flex" }}><AwardIcon size={18} style={{ color: "var(--ocean)" }} /></span> Surf Rewards
                </div>
              </div>

              {/* Help Center Section */}
              <div className="drawer-section">
                <span className="drawer-section-title">Support & Info</span>
                {isAuthenticated && !user?.is_admin && (
                  <div 
                    className="drawer-menu-item" 
                    onClick={() => {
                      setIsDrawerOpen(false);
                      openDrawer("chat");
                    }}
                  >
                    <span className="drawer-menu-icon" style={{ display: "flex" }}>
                      <ChatIcon size={18} style={{ color: "var(--ocean)" }} />
                    </span> 
                    Support Chat
                  </div>
                )}
                <div className="drawer-menu-item" onClick={() => alert("WaveMart Help Center - Contact us at support@wavemart.io")}>
                  <span className="drawer-menu-icon" style={{ display: "flex" }}><HelpIcon size={18} style={{ color: "var(--ocean)" }} /></span> FAQs & Help Center
                </div>
                <div className="drawer-menu-item" onClick={() => alert("WAVEMART shipping: Free shipping on orders above Rs.5000. 3-5 days delivery.")}>
                  <span className="drawer-menu-icon" style={{ display: "flex" }}><TruckIcon size={18} style={{ color: "var(--ocean)" }} /></span> Shipping & Returns Policy
                </div>
              </div>

              {/* AI Recommendations Section */}
              {isAuthenticated && (
                <div className="drawer-section" style={{ background: "rgba(14, 165, 233, 0.04)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(14, 165, 233, 0.1)" }}>
                  <span className="drawer-section-title" style={{ color: "var(--ocean-deep)", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: "bold" }}>
                    <SparklesIcon size={16} style={{ color: "var(--ocean-deep)" }} /> AI Recommendations
                  </span>
                  {recsLoading ? (
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Finding tailored suggestions...</span>
                  ) : (
                    <div style={{ fontSize: "0.82rem", lineHeight: "1.55", whiteSpace: "pre-line", color: "var(--text)" }}>
                      {recs || "Start shopping to receive personalized AI recommendations!"}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logout button at bottom of panel */}
            <div className="drawer-footer">
              {isAuthenticated ? (
                <button
                  type="button"
                  className="btn btn-outline drawer-logout-btn"
                  onClick={handleLogout}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <LogoutIcon size={18} /> Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{ width: "100%", display: "block", textAlign: "center", textDecoration: "none" }}
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;
