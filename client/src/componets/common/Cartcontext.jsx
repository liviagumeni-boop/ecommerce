import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // ADD TO CART
const addToCart = (product) => {
  setCart((prev) => {
    const exists = prev.find((p) => p.id === product.id);

    if (exists) {
      return prev.map((p) =>
        p.id === product.id
          ? { ...p, qty: p.qty + 1 }
          : p
      );
    }

    return [...prev, { ...product, qty: 1 }];
  });
};
  // REMOVE
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  // INCREASE
  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, qty: p.qty + 1 } : p
      )
    );
  };

  // DECREASE
  const decreaseQty = (id) => {
    setCart((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, qty: Math.max(1, p.qty - 1) }
          : p
      )
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);