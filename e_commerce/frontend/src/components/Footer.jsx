import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <p className="footer-brand">Wave Mart</p>
          <p className="footer-desc">
            Your one-stop destination for daily essentials, electronics, fashion, 
            and premium home products. Built for speed, choice, and ease.
          </p>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <ul className="footer-links">
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products">New Arrivals</Link></li>
            <li><Link to="/cart">Your Cart</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <ul className="footer-links">
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Create Account</Link></li>
          </ul>
        </div>
      </div>
      <p className="footer-bottom">
        © {new Date().getFullYear()} Wave Mart — Ride the wave 🏄
      </p>
    </footer>
  );
}

export default Footer;
