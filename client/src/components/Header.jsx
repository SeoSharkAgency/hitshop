import { Link } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

export default function Header() {
  const { totalItems } = useCart();
  const { dark, toggle } = useTheme();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-hit-blue/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-[1320px] mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/hit-logo.png" alt="ФК ХІТ" className="w-9 h-9 object-contain" />
          <span className="font-heading font-bold text-sm text-hit-cream tracking-wide">
            ФК «ХІТ»
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-hit-cream/60 hover:text-hit-cream transition-colors text-sm font-medium">
            Головна
          </Link>
          <Link to="/catalog" className="text-hit-cream/60 hover:text-hit-cream transition-colors text-sm font-medium">
            Каталог
          </Link>
          <Link to="/cart" className="relative text-hit-cream/60 hover:text-hit-cream transition-colors text-sm font-medium flex items-center gap-1.5">
            <FiShoppingCart size={15} />
            Кошик
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-hit-gold text-hit-blue text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-hit-cream/60 hover:text-hit-gold transition-colors"
          >
            {dark ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>
          <Link
            to={user ? '/account' : '/account/login'}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-hit-cream/60 hover:text-hit-gold transition-colors"
            title={user ? user.name : 'Увійти'}
          >
            {user ? (
              <span className="font-heading font-bold text-xs text-hit-gold">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <FiUser size={15} />
            )}
          </Link>
          <Link
            to="/catalog"
            className="bg-hit-gold hover:bg-hit-gold-hi text-hit-blue font-heading font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors"
          >
            Shop
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-hit-cream/70"
          >
            {dark ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>
          <Link to="/cart" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-hit-cream/70">
            <FiShoppingCart size={16} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-hit-gold text-hit-blue text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          <Link
            to={user ? '/account' : '/account/login'}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-hit-cream/70"
          >
            {user ? (
              <span className="font-heading font-bold text-xs text-hit-gold">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <FiUser size={16} />
            )}
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-hit-cream/70"
          >
            {menuOpen ? <FiX size={16} /> : <FiMenu size={16} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-hit-blue border-t border-white/5 px-5 py-4 space-y-1">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-hit-cream/70 hover:text-hit-cream text-sm py-2.5 font-medium">Головна</Link>
          <Link to="/catalog" onClick={() => setMenuOpen(false)} className="block text-hit-cream/70 hover:text-hit-cream text-sm py-2.5 font-medium">Каталог</Link>
          <Link to={user ? '/account' : '/account/login'} onClick={() => setMenuOpen(false)} className="block text-hit-cream/70 hover:text-hit-cream text-sm py-2.5 font-medium">
            {user ? 'Мій кабінет' : 'Увійти'}
          </Link>
        </div>
      )}
    </header>
  );
}
