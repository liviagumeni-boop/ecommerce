import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaHeart,
  FaHome,
  FaTrash,
  FaPlus,
  FaMinus,
  FaUser,
} from "react-icons/fa";

import { useCart } from "../componets/common/Cartcontext";
import { useFavorites } from "../componets/common/FavoritesContext";

type Product = {
  id: number;
  name: string;
  price?: number;
  qty?: number;
};

function Header() {
  const navigate = useNavigate();
  const cartRef = useRef<HTMLDivElement>(null);
const favRef = useRef<HTMLDivElement>(null);

  // track login state reactively instead of reading localStorage once
  const [isLoggedIn, setIsLoggedIn] = useState<string | null>(
    localStorage.getItem("token")
  );

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(localStorage.getItem("token"));

    // fires when localStorage changes from ANOTHER tab/window
    window.addEventListener("storage", syncAuth);
    // fires when we dispatch it ourselves (e.g. after logout in this tab)
    window.addEventListener("authChanged", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChanged", syncAuth);
    };
  }, []);

  const { cart, removeFromCart, increaseQty, decreaseQty, addToCart } = useCart();
  const { favorites, removeFromFavorites } = useFavorites();

  const [openCart, setOpenCart] = useState(false);
  const [openFav, setOpenFav] = useState(false);
const closeCart = () => setOpenCart(false);
const closeFav = () => setOpenFav(false);
  useEffect(() => {
   const handleClickOutside = (e: MouseEvent) => {
  if (cartRef.current && !cartRef.current.contains(e.target as Node)) setOpenCart(false);
  if (favRef.current && !favRef.current.contains(e.target as Node)) setOpenFav(false);
};
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cartCount = cart.reduce(
    (sum: number, item: Product) => sum + (item.qty || 1),
    0
  );

  return (
    <header className="navbar navbar-dark bg-dark px-3 d-flex align-items-center position-relative">

      {/* HOME */}
      <button className="btn btn-outline-light" onClick={() => navigate("/")}>
        <FaHome />
      </button>

      {/* TITLE */}
      <div className="text-white fw-bold mx-auto">Ecommerce Store</div>

      {/* RIGHT SIDE */}
      <div className="d-flex align-items-center gap-3 position-relative">

       {/* ================= FAVORITES ================= */}
{isLoggedIn && (
  <div className="position-relative" ref={favRef}>
    <button
      className="btn btn-outline-light"
      onClick={() => setOpenFav(!openFav)}
    >
      <FaHeart />
    </button>

    {openFav && (
      <div
        className="position-absolute bg-white shadow p-2"
        style={{ right: 0, width: 300, zIndex: 999 }}
      >
        <h6>Favorites</h6>

        {favorites.length === 0 && <small>Empty</small>}

        {favorites.map((p: Product) => (
          <div
            key={p.id}
            className="d-flex justify-content-between border-bottom py-1"
          >
            <span>{p.name}</span>

            <div className="d-flex gap-2">
              <FaShoppingCart
                style={{ cursor: "pointer" }}
                onClick={() => {
                  addToCart(p);
                  setOpenFav(false);
                }}
              />
              <FaTrash
                style={{ cursor: "pointer" }}
                onClick={() => {
                  removeFromFavorites(p.id);
                  setOpenFav(false);
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

        {/* ================= CART ================= */}
        <div className="position-relative" ref={cartRef}>
          <button
            className="btn btn-outline-light position-relative"
            onClick={() => setOpenCart(!openCart)}
          >
            <FaShoppingCart />

            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: "red",
                  color: "white",
                  borderRadius: "50%",
                  fontSize: 12,
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {openCart && (
            <div
              className="position-absolute bg-white shadow p-2"
              style={{ right: 0, width: 320, zIndex: 999 }}
            >
              <h6>Cart</h6>

              {cart.length === 0 && <small>Empty cart</small>}

              {cart.map((p: Product) => (
                <div key={p.id} className="border-bottom py-2">
                  <div className="d-flex justify-content-between">
                    <span>{p.name}</span>
                    <FaTrash
                      style={{ cursor: "pointer" }}
                       onClick={() => { removeFromCart(p.id); setOpenCart(false); }}
                    />
                  </div>

                  <div className="d-flex align-items-center gap-2 mt-1">
                    <FaMinus
                      style={{ cursor: "pointer" }}
                      onClick={() => decreaseQty(p.id)}
                    />
                    <span>{p.qty}</span>
                    <FaPlus
                      style={{ cursor: "pointer" }}
                      onClick={() => increaseQty(p.id)}
                    />
                  </div>
                </div>
              ))}

              <button
                className="btn btn-dark w-100 mt-2"
                onClick={() => { navigate("/cart"); setOpenCart(false); }}
              >
                Open Cart
              </button>

              <button
                className="btn btn-primary w-100 mt-1"
                onClick={() => { navigate("/checkout"); setOpenCart(false); }}
              >
                Checkout
              </button>
            </div>
          )}
        </div>

        {/* ================= USER AUTH ================= */}
        {!isLoggedIn ? (
          <>
            <button
              className="btn btn-outline-light"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

            <button
              className="btn btn-outline-light"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </button>
          </>
        ) : (
          <button
            className="btn btn-outline-light"
            onClick={() => navigate("/profile")}
          >
            <FaUser />
          </button>
        )}

      </div>
    </header>
  );
}

export default Header;
