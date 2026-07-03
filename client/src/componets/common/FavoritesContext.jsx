import { createContext, useContext, useEffect, useState } from "react";
import api from "../../api/axios";

const FavoritesContext = createContext();

const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.id ?? null;
  } catch {
    return null;
  }
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [userId, setUserId] = useState(getUserId());

  // ================= SYNC USER ID ACROSS LOGIN/LOGOUT =================
  useEffect(() => {
    const syncUser = () => setUserId(getUserId());

    window.addEventListener("storage", syncUser);
    window.addEventListener("authChanged", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("authChanged", syncUser);
    };
  }, []);

  // ================= LOAD FAVORITES =================
  const loadFavorites = async () => {
    if (!userId) {
      setFavorites([]); // clear stale favorites on logout
      return;
    }

    try {
      const res = await api.get("/favorites/me", {
        headers: { userid: userId },
      });

      setFavorites(res.data);
    } catch (err) {
      console.log("Favorites load error:", err);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  // ================= ADD =================
  const addToFavorites = async (product) => {
    if (!product?.id) {
      console.log("INVALID PRODUCT:", product);
      return;
    }

    await api.post(
      "/favorites/me",
      { productId: product.id },
      { headers: { userid: userId } }
    );

    loadFavorites();
  };

  const isFavorite = (id) => favorites.some((p) => p.id === id);

  // ================= REMOVE =================
  const removeFromFavorites = async (id) => {
    try {
      await api.delete(`/favorites/me/${id}`, {
        headers: { userid: userId },
      });

      loadFavorites();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, addToFavorites, removeFromFavorites, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);