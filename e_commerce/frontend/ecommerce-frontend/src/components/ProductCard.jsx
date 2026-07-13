import { Link } from "react-router-dom";
import { getProductVisuals, getStockTag } from "../utils/productDisplay";
import { PackageIcon } from "./Icons";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function ProductCard({ product, style, onAddToCart, isAdding }) {
  const visuals = getProductVisuals(product.id);
  const stockTag = getStockTag(product.stock);
  const outOfStock = product.stock <= 0;

  return (
    <article className="product-card" style={style}>
      <Link to={`/products/${product.id}`}>
        <div
          className="product-image"
          style={{ background: "#f8fafc" }}
        >
          {stockTag && <span className="product-tag">{stockTag}</span>}
          {product.image_url ? (
            <img 
              src={`${API_BASE_URL}${product.image_url}`} 
              alt={product.name} 
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: "0.5rem" }} 
            />
          ) : (
            <PackageIcon size={64} style={{ strokeWidth: "1.2px", color: "rgba(15, 23, 42, 0.45)" }} />
          )}
        </div>
      </Link>
      <div className="product-body">
        <p className="product-category">{product.category}</p>
        <h3 className="product-name">
          <Link to={`/products/${product.id}`} style={{ hover: { color: "var(--ocean)" } }}>
            {product.name}
          </Link>
        </h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <p className="product-price">Rs.{product.price.toFixed(2)}</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={outOfStock || isAdding}
            onClick={() => onAddToCart?.(product)}
          >
            {isAdding ? "Adding..." : outOfStock ? "Sold out" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
