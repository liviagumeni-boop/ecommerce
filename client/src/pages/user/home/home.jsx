import { useState, useEffect, useMemo } from "react";
import api, { BACKEND_URL } from "../../../api/axios";

import {
  FaHeart,
  FaShoppingCart,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaTimes,
  FaComments,
} from "react-icons/fa";

import { useCart } from "../../../componets/common/Cartcontext";
import { useFavorites } from "../../../componets/common/FavoritesContext";
import { useToast } from "../../../componets/common/ToastContext";

// Moved outside component so it's stable — no re-creation on every render
const carousel = [
  { tag: "Sale", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8" },
  { tag: "New", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30" },
  { tag: "Bestseller", img: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5" },
];

function Home() {
  const { addToCart } = useCart();
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { showToast } = useToast();

  // ── Auth token from OAuth redirect ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const user = params.get("user");

    if (token && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      if (user) {
        localStorage.setItem("user", decodeURIComponent(user));
      }
      window.history.replaceState({}, "", "/");

      window.dispatchEvent(new Event("authChanged"));

      if (role === "admin") {
        window.location.href = "/admin";
      }
    }
  }, []);

  const [category, setCategory] = useState([]);
  const [brand, setBrand] = useState([]);
  const [search, setSearch] = useState("");
  const [slide, setSlide] = useState(0);

  // ── Single carousel timer ────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % carousel.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const [openFilter, setOpenFilter] = useState(false);
  const [tempCategory, setTempCategory] = useState([]);
  const [tempBrand, setTempBrand] = useState([]);
  const [tempSort, setTempSort] = useState("");
  const [priceRange, setPriceRange] = useState(2500);
  const [sort, setSort] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ── Chatbot state ─────────────────────────────────────────────────────
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;

    setChatMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setChatInput("");

    try {
      const res = await api.post("/chat", { message: userMessage });
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.data.reply },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, something went wrong." },
      ]);
    }
  };

  // ── Data fetching ──────────────────────────────────────────────────────
  const fetchProducts = async () => {
    const res = await api.get("/products");
    setProducts(res.data);
  };

  const fetchCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data);
  };

  const fetchBrands = async () => {
    const res = await api.get("/brands");
    setBrands(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBrands();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toggleFav = (product) => {
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
      showToast("Removed from favorites", "warning");
    } else {
      addToFavorites(product);
      showToast("Added to favorites!", "success");
    }
  };

  const applyFilters = () => {
    setCategory(tempCategory);
    setBrand(tempBrand);
    setSort(tempSort);
    setOpenFilter(false);
  };

  const clearFilters = () => {
    setTempCategory([]);
    setTempBrand([]);
    setTempSort("");
    setCategory([]);
    setBrand([]);
    setSort("");
    setPriceRange(2500);
  };

  const getOptionsByCategory = (product) => {
    const cat = product?.category_name?.toLowerCase() || "";

    if (cat.includes("cloth")) {
      return { sizes: ["XS", "S", "M", "L", "XL", "XXL"], colors: [], memory: [] };
    }
    if (cat.includes("shoe")) {
      return { sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"], colors: [], memory: [] };
    }
    if (cat.includes("electronic")) {
      return { sizes: [], colors: ["Black", "Silver", "Blue"], memory: ["64GB", "128GB", "256GB", "512GB", "1TB"] };
    }
    return { sizes: [], colors: [], memory: [] };
  };

  const filtered = useMemo(() => {
    let result = products.filter((p) =>
      (category.length === 0 || category.includes(p.category_name)) &&
      (brand.length === 0 || brand.includes(p.brand_name)) &&
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      Number(p.sale_price) <= priceRange
    );

    if (sort === "low") {
      result.sort((a, b) => Number(a.sale_price) - Number(b.sale_price));
    }

    if (sort === "high") {
      result.sort((a, b) => Number(b.sale_price) - Number(a.sale_price));
    }

    return result;
  }, [products, category, brand, search, sort, priceRange]);

  const options = selectedProduct
    ? getOptionsByCategory(selectedProduct)
    : { sizes: [], colors: [], memory: [] };

  const toggleCategory = (name) => {
    setTempCategory((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const toggleBrand = (name) => {
    setTempBrand((prev) =>
      prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* CAROUSEL */}
      <div className="position-relative">
        <img
          src={carousel[slide].img}
          style={{ width: "100%", height: 320, objectFit: "cover" }}
        />
      </div>

      {/* SEARCH + FILTER */}
      <div style={{ display: "flex", gap: 10, padding: 15 }}>
        <input
          className="form-control"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setOpenFilter(true)}>
          <FaFilter />
        </button>
      </div>

      {/* FILTER SIDEBAR */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: openFilter ? 0 : "-320px",
          width: 300,
          height: "100vh",
          background: "#fff",
          transition: "0.3s",
          zIndex: 999,
          padding: 15,
          overflowY: "auto",
          boxShadow: "2px 0 10px rgba(0,0,0,0.2)",
        }}
      >
        <div
          onClick={() => setOpenFilter(false)}
          style={{ position: "absolute", top: 10, right: 10, cursor: "pointer", fontSize: 18, color: "#333" }}
        >
          <FaTimes />
        </div>

        <h5>Filters</h5>

        <h6>Categories</h6>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className="btn btn-sm w-100 mb-1"
            onClick={() => toggleCategory(c.name)}
            style={{
              border: "1px solid #ccc",
              background: tempCategory.includes(c.name) ? "#e9ecef" : "white",
              color: "#333",
            }}
          >
            {c.name}
          </button>
        ))}

        <h6>Brands</h6>
        {brands.map((b) => (
          <button
            key={b.id}
            type="button"
            className="btn btn-sm w-100 mb-1"
            onClick={() => toggleBrand(b.name)}
            style={{
              border: "1px solid #bcdcfb",
              background: tempBrand.includes(b.name) ? "#e6f1fb" : "white",
              color: "#185fa5",
            }}
          >
            {b.name}
          </button>
        ))}

        <h6>Sort</h6>
        <button onClick={() => setTempSort("low")} className="btn btn-sm btn-dark w-100 mb-1">
          Low → High
        </button>
        <button onClick={() => setTempSort("high")} className="btn btn-sm btn-dark w-100">
          High → Low
        </button>

        <input
          type="range"
          min="0"
          max="2500"
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          style={{ width: "100%", marginTop: 10 }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="btn btn-danger flex-fill" onClick={clearFilters}>
            CLEAR
          </button>
          <button className="btn btn-success flex-fill" onClick={applyFilters}>
            SAVE
          </button>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        {/* PRODUCT GRID */}
        <div style={{ flex: 1, padding: 15, height: "70vh", overflowY: "auto" }}>
          <div className="row g-3">
            {filtered.map((p) => (
              <div className="col-md-4" key={p.id}>
                <div
                  className="card position-relative h-100"
                  style={{ height: 420, display: "flex", flexDirection: "column" }}
                >
                  <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 10 }}>
                    <FaHeart
                      style={{ cursor: "pointer", color: isFavorite(p.id) ? "red" : "gray" }}
                      onClick={() => toggleFav(p)}
                    />
                  </div>

                  <img
                    src={p.image ? `${BACKEND_URL}${p.image}` : "https://placehold.co/400x300?text=No+Image"}
                    style={{ width: "100%", height: 180, objectFit: "cover", cursor: "pointer" }}
                    onClick={() => { setSelectedProduct(p); setSelectedSize(null); }}
                    onError={(e) => { e.target.src = "https://placehold.co/400x300?text=No+Image"; }}
                  />

                  <div className="card-body">
                    <h6 className="fw-bold">{p.name}</h6>
                    <small className="text-muted d-block">Brand: {p.brand_name}</small>
                    <small className="text-muted d-block">Category: {p.category_name}</small>
                    <p className="mt-2 mb-1">{p.description}</p>
                    <strong className="text-success">€{p.sale_price}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECOMMENDED */}
        <div style={{ width: 280, padding: 15 }}>
          <h5>Recommended</h5>
          {products.slice(0, 5).map((p) => (
            <div key={p.id} className="card mb-2">
              <img
                src={p.image ? `${BACKEND_URL}${p.image}` : `https://placehold.co/300x200?text=${p.category_name}`}
                style={{ height: 80, width: "100%", objectFit: "cover" }}
                onError={(e) => { e.target.src = `https://placehold.co/300x200?text=${p.category_name}`; }}
              />
              <small className="p-2">
                {p.name}<br />
                <strong>€{p.sale_price}</strong>
              </small>
            </div>
          ))}
        </div>

        {/* PRODUCT DETAIL MODAL */}
        {selectedProduct && (
          <div
            onClick={() => { setSelectedProduct(null); setSelectedSize(null); setSelectedColor(null); setSelectedMemory(null); }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff",
                width: "90%",
                maxWidth: 800,
                borderRadius: 12,
                display: "flex",
                gap: 20,
                padding: 20,
              }}
            >
              <img
                src={selectedProduct.image ? `${BACKEND_URL}${selectedProduct.image}` : "https://placehold.co/400x300"}
                style={{ width: "50%", objectFit: "cover", borderRadius: 10 }}
              />

              <div style={{ flex: 1 }}>
                <h2>{selectedProduct.name}</h2>
                <p>{selectedProduct.description}</p>
                <p><b>Brand:</b> {selectedProduct.brand_name}</p>
                <p><b>Category:</b> {selectedProduct.category_name}</p>
                <h3 style={{ color: "green" }}>€{selectedProduct.sale_price}</h3>

                {options.sizes.length > 0 && (
                  <div>
                    <h6>Sizes</h6>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {options.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          style={{
                            padding: "6px 10px",
                            border: "1px solid #333",
                            borderRadius: 6,
                            background: selectedSize === s ? "#3d99f5" : "white",
                            color: selectedSize === s ? "white" : "black",
                            cursor: "pointer",
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {options.memory.length > 0 && (
                  <div>
                    <h6>Memory</h6>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {options.memory.map((m) => (
                        <span
                          key={m}
                          onClick={() => setSelectedMemory(m)}
                          style={{
                            padding: "5px 10px",
                            border: "1px solid #333",
                            borderRadius: 6,
                            cursor: "pointer",
                            background: selectedMemory === m ? "#3d99f5" : "transparent",
                            color: selectedMemory === m ? "white" : "black",
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {options.colors.length > 0 && (
                  <div>
                    <h6>Colors</h6>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {options.colors.map((c) => (
                        <span
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          style={{
                            padding: "5px 10px",
                            border: "1px solid #333",
                            borderRadius: 6,
                            cursor: "pointer",
                            background: selectedColor === c ? "#3d99f5" : "transparent",
                            color: selectedColor === c ? "white" : "black",
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button
                    onClick={() => {
                      toggleFav(selectedProduct);
                      setSelectedProduct(null);
                      setSelectedSize(null);
                      setSelectedColor(null);
                      setSelectedMemory(null);
                    }}
                    style={{
                      padding: 10,
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: isFavorite(selectedProduct.id) ? "red" : "#eee",
                      color: isFavorite(selectedProduct.id) ? "white" : "black",
                    }}
                  >
                    Favorite
                  </button>

                  <button
                    onClick={() => {
                      const cat = selectedProduct?.category_name?.toLowerCase() || "";

                      if ((cat.includes("cloth") || cat.includes("shoe")) && options.sizes.length > 0 && !selectedSize) {
                        showToast("Please select a size first", "warning");
                        return;
                      }

                      if (cat.includes("electronic") && options.memory.length > 0 && !selectedMemory) {
                        showToast("Please select memory first", "warning");
                        return;
                      }

                      if (cat.includes("electronic") && options.colors.length > 0 && !selectedColor) {
                        showToast("Please select a color first", "warning");
                        return;
                      }

                      addToCart({
                        ...selectedProduct,
                        selectedSize,
                        selectedColor,
                        selectedMemory,
                      });

                      showToast("Product added to cart!", "success");

                      setSelectedProduct(null);
                      setSelectedSize(null);
                      setSelectedColor(null);
                      setSelectedMemory(null);
                    }}
                    style={{
                      padding: 10,
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: "#3d99f5",
                      color: "white",
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CHATBOT BUBBLE — rendered once, fixed to viewport */}
      <div
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 65,
          height: 65,
          borderRadius: "50%",
          background: "#0d6efd",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          zIndex: 1000,
          boxShadow: "0 5px 15px rgba(0,0,0,.3)",
        }}
      >
        <FaComments size={28} />
      </div>

      {chatOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 95,
            right: 20,
            width: 350,
            height: 500,
            background: "white",
            borderRadius: 15,
            boxShadow: "0 10px 30px rgba(0,0,0,.25)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: 15,
              background: "#0d6efd",
              color: "white",
              borderTopLeftRadius: 15,
              borderTopRightRadius: 15,
              fontWeight: "bold",
            }}
          >
            AI Shopping Assistant
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  textAlign: msg.role === "user" ? "right" : "left",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    background: msg.role === "user" ? "#0d6efd" : "#f1f1f1",
                    color: msg.role === "user" ? "white" : "black",
                    padding: "8px 12px",
                    borderRadius: 10,
                    maxWidth: "80%",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", padding: 10, gap: 10 }}>
            <input
              className="form-control"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="btn btn-primary" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;