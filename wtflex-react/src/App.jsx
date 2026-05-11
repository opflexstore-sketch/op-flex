import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './CartContext.jsx';
import { AuthProvider } from './AuthContext.jsx';
import AnnouncementBar from './components/AnnouncementBar.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import CollectionPage from './pages/CollectionPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import BackgroundEffects from './components/BackgroundEffects.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <BackgroundEffects />
          <AnnouncementBar />
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products/:handle" element={<ProductPage />} />
              <Route path="/collections/:handle" element={<CollectionPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            </Routes>
          </main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
