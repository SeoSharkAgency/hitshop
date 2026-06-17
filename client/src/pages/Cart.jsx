import { Link } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../api';

export default function Cart() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="pt-24 max-w-6xl mx-auto px-4 py-20 text-center">
        <img src="/hit-logo.png" alt="" className="w-14 h-16 object-contain mx-auto mb-5 opacity-15" />
        <h1 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-2">порожньо</h1>
        <p className="text-gray-400 dark:text-white/40 text-sm mb-6">час щось обрати 👀</p>
        <Link to="/catalog" className="btn-primary">каталог</Link>
      </div>
    );
  }

  return (
    <div className="pt-24 max-w-2xl mx-auto px-4 pb-16">
      <h1 className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-6">Кошик</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.id}-${item.size}`}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
              {item.image ? (
                <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <img src="/hit-logo.png" alt="" className="w-7 h-8 object-contain opacity-20" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 dark:text-white text-sm font-medium truncate">{item.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {item.size && <span className="text-gray-400 dark:text-white/40 text-xs">{item.size}</span>}
                <span className="text-hit-blue dark:text-hit-yellow text-xs font-semibold">
                  {Number(item.price).toLocaleString()} ₴
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-all"
              >
                <FiMinus size={11} />
              </button>
              <span className="w-6 text-center text-gray-900 dark:text-white text-xs font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-all"
              >
                <FiPlus size={11} />
              </button>
            </div>

            <button
              onClick={() => removeItem(item.id, item.size)}
              className="p-1.5 text-gray-300 dark:text-white/30 hover:text-red-400 transition-colors"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-gray-400 dark:text-white/50 text-sm">разом</span>
          <span className="font-heading font-bold text-xl text-hit-blue dark:text-hit-yellow">
            {totalPrice.toLocaleString()} ₴
          </span>
        </div>
        <Link to="/checkout" className="btn-primary w-full text-center block">
          оформити
        </Link>
      </div>
    </div>
  );
}
