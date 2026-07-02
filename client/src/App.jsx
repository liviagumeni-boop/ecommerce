import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./componets/common/Cartcontext";
import { FavoritesProvider } from "./componets/common/FavoritesContext";
import { ToastProvider } from "./componets/common/ToastContext";

import Header from "./layout/header";
import Footer from "./layout/footer";

// USER PAGES
import Home from "./pages/user/home/home";
import Cart from "./pages/user/cart/cart";
import Checkout from "./pages/user/payment/checkout";
import CheckoutReturn from "./pages/user/payment/checkoutreturn";

import Profile from "./pages/user/profili/profil";
import Login from "./pages/user/home/login";
import UserOrders from "./pages/user/order/order";
import Signup from "./pages/user/home/signup";
import PaymentSuccess from "./pages/user/home/PaymentSuccess";
import PaymentFailed from "./pages/user/home/PayemtFailed";
import UserRoute from "./routes/UserRoute";
// ADMIN PAGES
import Products from "./pages/admin/products/products";
import Entries from "./pages/admin/products/enter";
import Categories from "./pages/admin/categories/categories";
import Settings from "./pages/admin/settings/settings";
import AdminHome from "./pages/admin/home/AdminHome";
import Orders from "./pages/admin/sales/orders";
import Users from "./pages/admin/customers/users";
import Exit from "./pages/admin/sales/exit";
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
 <ToastProvider>
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
    <UserRoute>
      <UserLayout>
        <Profile />
      </UserLayout>
    </UserRoute>
  }
/>
              <Route
                path="/cart"
                element={
                  <UserRoute>
                  <UserLayout>
                    <Cart />
                  </UserLayout></UserRoute>
                }
              />

              <Route
                path="/checkout"
                element={
                  <UserRoute>
                  <UserLayout>
                    <Checkout />
                  </UserLayout></UserRoute>
                }
              />
<Route path="/checkout/return" element={<CheckoutReturn />} />
             <Route
  path="/payment-success"
  element={
    <UserRoute>
      <UserLayout>
        <PaymentSuccess />
      </UserLayout>
    </UserRoute>
  }
/>

             <Route
  path="/payment-failed"
  element={
    <UserRoute>
      <UserLayout>
        <PaymentFailed />
      </UserLayout>
    </UserRoute>
  }
/>

            <Route
  path="/orders"
  element={
    <UserRoute>
      <UserLayout>
      <UserOrders />
      </UserLayout>
    </UserRoute>
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
  path="/admin/products/enter"
  element={
    <AdminRoute>
      <Entries />
    </AdminRoute>
  }
/>
<Route
  path="/admin/sales/exit"
  element={
    <AdminRoute>
      <Exit />
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
    </ToastProvider>
  );
}

export default App;