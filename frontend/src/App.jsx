import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./shared/contexts/AuthContext";
import HeaderA from "./shared/components/Header/HeaderA";
import HeaderB from "./shared/components/Header/HeaderB";
import HeaderC from "./shared/components/Header/HeaderC";
import Home from "./pages/Home/Home";
import Auth from "./pages/Auth/Auth";
import "./shared/lib/iconLibrary";

// Header Wrapper Component to handle conditional rendering
function AppHeader() {
  const location = useLocation();

  // Determine which header to show based on current route
  if (location.pathname === "/auth") {
    return <HeaderB />;
  }

  if (location.pathname.startsWith("/seller") || location.pathname.startsWith("/admin")) {
    return <HeaderC />;
  }

  // Default to HeaderA for all other routes
  return <HeaderA />;
}

function AppContent() {
  return (
    <div className="App">
      <AppHeader />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/products" element={<h2>商品頁面開發中...</h2>} />
          <Route path="/categories" element={<h2>分類頁面開發中...</h2>} />
          <Route path="/deals" element={<h2>優惠活動頁面開發中...</h2>} />
          <Route path="/about" element={<h2>關於我們頁面開發中...</h2>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
