import { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
  FaHeart,
  FaShoppingCart,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaTimes,
} from "react-icons/fa";

import { useCart } from "../../../componets/common/Cartcontext";
import { useFavorites } from "../../../componets/common/FavoritesContext";

function Home() {
  const { addToCart } = useCart();
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    if (token && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      window.history.replaceState({}, "", "/");
      if (role === "admin") {
        window.location.href = "/admin";
      }
    }
  }, []);

  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [search, setSearch] = useState("");
  const [slide, setSlide] = useState(0);
useEffect(() => {
  const timer = setInterval(() => {
    setSlide((prev) => (prev + 1) % carousel.length);
  }, 3000); // changes every 3 seconds

  return () => clearInterval(timer);
}, []);
  const [openFilter, setOpenFilter] = useState(false);

  const [tempCategory, setTempCategory] = useState("All");
  const [tempBrand, setTempBrand] = useState("All");
  const [tempSort, setTempSort] = useState("");
  const [priceRange, setPriceRange] = useState(2500);
  const [sort, setSort] = useState("");
const [selectedSize, setSelectedSize] = useState(null);
const [selectedColor, setSelectedColor] = useState(null);
const [selectedMemory, setSelectedMemory] = useState(null);
  const carousel = [
    { tag: "Sale", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8" },
    { tag: "New", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30" },
    { tag: "Bestseller", img: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5" },
  ];

const [products, setProducts] = useState([]);
const [categories, setCategories] = useState([]);
const [brands, setBrands] = useState([]);
const [selectedProduct, setSelectedProduct] = useState(null);
  const isFav = (id) => favorites.some((p) => p.id === id);

  const toggleFav = (product) => {
    if (isFav(product.id)) removeFromFavorites(product.id);
    else addToFavorites(product);
  };
useEffect(() => {
  const timer = setInterval(() => {
    setSlide((prev) => (prev + 1) % carousel.length);
  }, 3000);

  return () => clearInterval(timer);
}, [carousel.length]);

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

const applyFilters = () => {
  setCategory(tempCategory);
  setBrand(tempBrand);
  setSort(tempSort);
  setOpenFilter(false);
};

const clearFilters = () => {
  setTempCategory("All");
  setTempBrand("All");
  setTempSort("");
  setPriceRange(2500);
};

const getOptionsByCategory = (product) => {
  const cat = product?.category_name?.toLowerCase() || "";

  if (cat.includes("cloth")) {
    return {
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: [],
      memory: [],
    };
  }

  if (cat.includes("shoe")) {
    return {
      sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
      colors: [],
      memory: [],
    };
  }

  if (cat.includes("electronic")) {
    return {
      sizes: [],
      colors: ["Black", "Silver", "Blue"],
      memory: ["64GB", "128GB", "256GB", "512GB", "1TB"],
    };
  }

  return {
    sizes: [],
    colors: [],
    memory: [],
  };
};
const filtered = products.filter((p) =>
  (category === "All" || p.category_name === category) &&
  (brand === "All" || p.brand_name === brand) &&
  p.name.toLowerCase().includes(search.toLowerCase())
);
const options = selectedProduct
  ? getOptionsByCategory(selectedProduct)
  : { sizes: [], colors: [], memory: [] };
useEffect(() => {
  console.log("PRODUCTS:", products);
}, [products]);
  return (
    <div>

      {/* CAROUSEL (PA PREKUR) */}
      <div className="position-relative">
        <img src={carousel[slide].img} style={{ width: "100%", height: 320, objectFit: "cover" }} />

      </div>


      {/* PRODUCTS + RECOMMENDED */}

      {/* SEARCH + FILTER (vetëm mbi produkte) */}
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

      {/* FILTER SIDEBAR SLIDE (LEFT) */}
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
          boxShadow: "2px 0 10px rgba(0,0,0,0.2)"
        }}
      >
        <div
          onClick={() => setOpenFilter(false)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            cursor: "pointer",
            fontSize: 18,
            color: "#333",
          }}
        >
          <FaTimes />
        </div>

        <h5>Filters</h5>
        <h6>Categories</h6>
       {categories.map((c) => (
  <button
    key={c.id}
    className="btn btn-sm btn-outline-dark w-100 mb-1"
    onClick={() => setTempCategory(c.name)}
  >
    {c.name}
  </button>
))}
        <h6>Brands</h6>
       {brands.map((b) => (
  <button
    key={b.id}
    className="btn btn-sm btn-outline-primary w-100 mb-1"
    onClick={() => setTempBrand(b.name)}
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

        <button className="btn btn-success w-100 mt-2" onClick={applyFilters}>
          SAVE
        </button>

        <button className="btn btn-danger w-100 mt-2" onClick={clearFilters}>
          CLEAR
        </button>
      </div>
      <div style={{ display: "flex" }}>

        {/* PRODUCTS (3 KOLONA + SCROLL RUHET) */}
        <div style={{
          flex: 1,
          padding: 15,
          height: "70vh",
          overflowY: "auto"
        }}>
          <div className="row g-3">

            {filtered.map((p) => (
              <div className="col-md-4" key={p.id}>
               <div
  className="card position-relative h-100"
  style={{
    height: 420,
    display: "flex",
    flexDirection: "column",
  }}
>

                  <div style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    display: "flex",
                    gap: 10
                  }}>
                    <FaHeart
                      style={{ cursor: "pointer", color: isFav(p.id) ? "red" : "gray" }}
                      onClick={() => toggleFav(p)}
                    />
                  </div>
<img
  src={
    p.image
      ? `http://localhost:5000${p.image}`
      : "https://placehold.co/400x300?text=No+Image"
  }
  style={{
    width: "100%",
    height: 180,
    objectFit: "cover",
    cursor: "pointer"
  }}
 onClick={() => {
  setSelectedProduct(p);
  setSelectedSize(null);
}}
  onError={(e) => {
    e.target.src = "https://placehold.co/400x300?text=No+Image";
  }}
/>
<div className="card-body">
  <h6 className="fw-bold">{p.name}</h6>

  <small className="text-muted d-block">
    Brand: {p.brand_name}
  </small>

  <small className="text-muted d-block">
    Category: {p.category_name}
  </small>

  <p className="mt-2 mb-1">
    {p.description}
  </p>

  <strong className="text-success">
    €{p.sale_price}
  </strong>
  {/* SIZES */}

</div>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* RECOMMENDED */}
        <div style={{ width: 280, padding: 15 }}>
          <h5>Recommended</h5>
{products.slice(0,5).map((p) => (
  <div key={p.id} className="card mb-2">

<img
  src={
    p.image
      ? `http://localhost:5000${p.image}`
      : `https://placehold.co/300x200?text=${p.category_name}`
  }
  style={{
    height: 80,
    width: "100%",
    objectFit: "cover"
  }}
  onError={(e) => {
    e.target.src = `https://placehold.co/300x200?text=${p.category_name}`;
  }}
/>

    <small className="p-2">
      {p.name}
      <br />
      <strong>€{p.sale_price}</strong>
    </small>

  </div>
))}
        </div>
{selectedProduct && (
  <div
    onClick={() => setSelectedProduct(null)}
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
      {/* IMAGE */}
      <img
        src={
          selectedProduct.image
            ? `http://localhost:5000${selectedProduct.image}`
            : "https://placehold.co/400x300"
        }
        style={{
          width: "50%",
          objectFit: "cover",
          borderRadius: 10,
        }}
      />

      {/* INFO */}
      <div style={{ flex: 1 }}>
        <h2>{selectedProduct.name}</h2>

        <p>{selectedProduct.description}</p>

        <p><b>Brand:</b> {selectedProduct.brand_name}</p>
        <p><b>Category:</b> {selectedProduct.category_name}</p>

        <h3 style={{ color: "green" }}>
          €{selectedProduct.sale_price}
        </h3>
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
        {/* BUTTONS */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={() => toggleFav(selectedProduct)}
            style={{
              padding: 10,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              background: isFav(selectedProduct.id) ? "red" : "#eee",
              color: isFav(selectedProduct.id) ? "white" : "black",
            }}
          >
             Favorite
          </button>

<button
  onClick={() => {
    const cat = selectedProduct?.category_name?.toLowerCase() || "";

    if (
      (cat.includes("cloth") || cat.includes("shoe")) &&
      options.sizes.length > 0 &&
      !selectedSize
    ) {
      alert("Please select a size first");
      return;
    }

    if (
      cat.includes("electronic") &&
      options.memory.length > 0 &&
      !selectedMemory
    ) {
      alert("Please select memory first");
      return;
    }

    if (
      cat.includes("electronic") &&
      options.colors.length > 0 &&
      !selectedColor
    ) {
      alert("Please select a color first");
      return;
    }

    addToCart({
      ...selectedProduct,
      selectedSize,
      selectedColor,
      selectedMemory,
    });

    alert("Product added to cart!");
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
  </div>
    
     
)} 


export default Home ;