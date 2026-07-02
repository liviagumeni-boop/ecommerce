import { createContext, useContext, useState, useEffect, useRef } from "react";

const CartContext = createContext();
const GUEST_CART_KEY = "guest_cart";
const userCartKey = (userId) => `cart_${userId}`;

export const CartProvider = ({ children }) => {
  const getInitialCart = () => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?._id || user?.id;

      // If logged in, load THEIR cart. Otherwise load the guest cart.
      const key = userId ? userCartKey(userId) : GUEST_CART_KEY;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [cart, setCart] = useState(getInitialCart);
  const hasMergedRef = useRef(false);

  // Persist cart under the right key any time it changes
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?._id || user?.id;
      const key = userId ? userCartKey(userId) : GUEST_CART_KEY;
      localStorage.setItem(key, JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to persist cart:", err);
    }
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: p.qty + 1 } : p))
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, qty: Math.max(1, p.qty - 1) } : p
      )
    );
  };

  // Call this right after a successful login (or when the app detects
  // an existing session, e.g. on Google OAuth redirect back)
  const mergeGuestCartWithUser = (userId) => {
    if (!userId || hasMergedRef.current) return;
    hasMergedRef.current = true;

    try {
      const guestCart = JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || [];
      if (guestCart.length === 0) {
        // Nothing to merge, just load whatever the user already had
        const existing = JSON.parse(localStorage.getItem(userCartKey(userId))) || [];
        setCart(existing);
        return;
      }

      const existingUserCart =
        JSON.parse(localStorage.getItem(userCartKey(userId))) || [];

      const merged = [...existingUserCart];
      guestCart.forEach((guestItem) => {
        const idx = merged.findIndex((p) => p.id === guestItem.id);
        if (idx > -1) {
          merged[idx] = { ...merged[idx], qty: merged[idx].qty + guestItem.qty };
        } else {
          merged.push(guestItem);
        }
      });

      setCart(merged);
      localStorage.setItem(userCartKey(userId), JSON.stringify(merged));
      localStorage.removeItem(GUEST_CART_KEY);
    } catch (err) {
      console.error("Cart merge failed:", err);
      hasMergedRef.current = false;
    }
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        mergeGuestCartWithUser,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);