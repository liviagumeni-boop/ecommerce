import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./componets/common/Cartcontext";
import { FavoritesProvider } from "./componets/common/FavoritesContext";

import Header from "./layout/header";
import Footer from "./layout/Footer";

// USER PAGES
import Home from "./pages/user/home/Home";
import Cart from "./pages/user/cart/Cart";
import Checkout from "./pages/user/payment/checkout";
import Profile from "./pages/user/profili/Profil";
import Login from "./pages/user/home/login";
import UserOrders from "./pages/user/order/order";
import Signup from "./pages/user/home/signup";
import PaymentSuccess from "./pages/user/home/PaymentSuccess";
import PaymentFailed from "./pages/user/home/PayemtFailed";

// ADMIN PAGES
import Products from "./pages/admin/products/Products";
import Categories from "./pages/admin/categories/Categories";
import Settings from "./pages/admin/settings/settings";
import AdminHome from "./pages/admin/home/AdminHome";
import Orders from "./pages/admin/sales/Orders";
import Users from "./pages/admin/customers/users";

// PROTECTED ROUTE
import AdminRoute from "./routes/AdminRoute";

// ================= LAYOUTS =================

function UserLayout({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

function HomeLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

// ================= APP =================

function App() {
  return (
    <CartProvider>
      <FavoritesProvider>
        <BrowserRouter>
          <div className="app">
            <Routes>

              {/* 🟢 HOME */}
              <Route
                path="/"
                element={
                  <HomeLayout>
                    <Home />
                  </HomeLayout>
                }
              />

              {/* 🟢 USER PAGES */}
              <Route
                path="/profile"
                element={
                  <UserLayout>
                    <Profile />
                  </UserLayout>
                }
              />

              <Route
                path="/cart"
                element={
                  <UserLayout>
                    <Cart />
                  </UserLayout>
                }
              />

              <Route
                path="/checkout"
                element={
                  <UserLayout>
                    <Checkout />
                  </UserLayout>
                }
              />

              <Route
                path="/payment-success"
                element={
                  <UserLayout>
                    <PaymentSuccess />
                  </UserLayout>
                }
              />

              <Route
                path="/payment-failed"
                element={
                  <UserLayout>
                    <PaymentFailed />
                  </UserLayout>
                }
              />

              <Route
                path="/orders"
                element={
                  <UserLayout>
                    <UserOrders />
                  </UserLayout>
                }
              />

              {/* 🔴 AUTH */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* 🔴 ADMIN */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminHome />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/products"
                element={
                  <AdminRoute>
                    <Products />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/categories"
                element={
                  <AdminRoute>
                    <Categories />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/settings"
                element={
                  <AdminRoute>
                    <Settings />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/orders"
                element={
                  <AdminRoute>
                    <Orders />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/customers/users"
                element={
                  <AdminRoute>
                    <Users />
                  </AdminRoute>
                }
              />

            </Routes>
          </div>
        </BrowserRouter>
      </FavoritesProvider>
    </CartProvider>
  );
}

export default App;