import { Link } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { totalItems } = useCart();
  const { dark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-4 pt-3">
        <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/hit-logo.png" alt="ФК Хіт" className="w-8 h-10 object-contain" />
            <span className="font-heading font-bold text-base text-gray-900 dark:text-white">
              hit<span className="text-hit-blue dark:text-hit-yellow">shop</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">
              home
            </Link>
            <Link to="/catalog" className="text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">
              каталог
            </Link>
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white/60 hover:text-hit-blue dark:hover:text-hit-yellow transition-all"
            >
              {dark ? <FiSun size={15} /> : <FiMoon size={15} />}
            </button>
            <Link
              to="/cart"
              className="relative w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white/60 hover:text-hit-blue dark:hover:text-hit-yellow transition-all"
            >
              <FiShoppingCart size={15} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-hit-yellow text-[#0a0e1a] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link
              to="/admin"
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white/60 hover:text-hit-blue dark:hover:text-hit-yellow transition-all hidden md:flex"
            >
              <FiUser size={15} />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white/60 transition-all md:hidden"
            >
              {menuOpen ? <FiX size={15} /> : <FiMenu size={15} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-2 glass rounded-2xl px-5 py-4 space-y-2 shadow-sm">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-sm py-1.5">home</Link>
            <Link to="/catalog" onClick={() => setMenuOpen(false)} className="block text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-sm py-1.5">каталог</Link>
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-sm py-1.5">адмін</Link>
          </div>
        )}
      </div>
    </header>
  );
}
