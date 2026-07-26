import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useUser } from './context/UserContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductPage from './pages/ProductPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderStatus from './pages/OrderStatus';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserAuth from './pages/UserAuth';
import UserCabinet from './pages/UserCabinet';

function SiteGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('siteAccess') === '1');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (unlocked) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login === 'adminHIT' && password === 'adminHIT') {
      sessionStorage.setItem('siteAccess', '1');
      setUnlocked(true);
    } else {
      setError('Невірний логін або пароль');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-hit-navy flex items-center justify-center px-5">
      <div className="bg-white dark:bg-hit-blue/60 rounded-2xl p-8 w-full max-w-sm border border-gray-100 dark:border-white/10 shadow-[0_24px_56px_rgba(8,29,69,.5)]">
        <div className="text-center mb-6">
          <img src="/hit-logo.png" alt="ФК ХІТ" className="w-14 h-14 object-contain mx-auto mb-3" />
          <p className="font-heading font-bold text-hit-ink dark:text-hit-cream text-sm">Доступ обмежено</p>
          <p className="text-hit-muted dark:text-hit-cream/50 text-xs mt-1">Введіть логін та пароль</p>
        </div>
        {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={login}
            onChange={(e) => { setLogin(e.target.value); setError(''); }}
            placeholder="Логін"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-hit-navy/50 text-hit-ink dark:text-hit-cream text-sm focus:outline-none focus:border-hit-gold"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Пароль"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-hit-navy/50 text-hit-ink dark:text-hit-cream text-sm focus:outline-none focus:border-hit-gold"
          />
          <button type="submit" className="btn-primary w-full">Увійти</button>
        </form>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-hit-gold">Завантаження...</div></div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}

function UserRoute({ children }) {
  const { user, loading } = useUser();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-hit-gold">Завантаження...</div></div>;
  if (!user) return <Navigate to="/account/login" replace />;
  return children;
}

export default function App() {
  return (
    <SiteGate>
      <div className="min-h-screen flex flex-col">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '13px',
            },
          }}
        />
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:orderNumber" element={<OrderStatus />} />
            <Route path="/order-success/:id" element={<OrderSuccess />} />
            <Route path="/account/login" element={<UserAuth />} />
            <Route path="/account" element={<UserRoute><UserCabinet /></UserRoute>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </SiteGate>
  );
}
