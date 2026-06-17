import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { getImageUrl } from '../api';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const { addItem } = useCart();

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        const raw = typeof res.data.sizes === 'string' ? JSON.parse(res.data.sizes) : res.data.sizes;
        const obj = Array.isArray(raw) ? raw.reduce((o, s) => ({ ...o, [s]: null }), {}) : (raw || {});
        const firstAvailable = Object.entries(obj).find(([, qty]) => qty === null || qty > 0);
        if (firstAvailable) setSelectedSize(firstAvailable[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="pt-24 max-w-6xl mx-auto px-4">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-2xl"></div>
          <div className="space-y-4 py-8">
            <div className="h-5 bg-gray-100 dark:bg-white/5 rounded-full w-3/4"></div>
            <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-24 max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 dark:text-white/40">не знайшли 🤷</p>
        <Link to="/catalog" className="btn-primary mt-4 inline-block">каталог</Link>
      </div>
    );
  }

  const rawSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
  const sizesObj = Array.isArray(rawSizes)
    ? rawSizes.reduce((obj, s) => ({ ...obj, [s]: null }), {})
    : (rawSizes || {});
  const sizeKeys = Object.keys(sizesObj);
  const hasSizes = sizeKeys.length > 0;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      toast.error('обери розмір');
      return;
    }
    if (hasSizes && sizesObj[selectedSize] !== null && sizesObj[selectedSize] <= 0) {
      toast.error('цього розміру немає в наявності');
      return;
    }
    addItem(
      { id: product.id, name: product.name, price: Number(product.price), image: product.image },
      selectedSize
    );
    toast.success('додано ✓');
  };

  return (
    <div className="pt-24 max-w-6xl mx-auto px-4 pb-16">
      <Link to="/catalog" className="inline-flex items-center gap-1.5 text-gray-400 dark:text-white/40 hover:text-hit-blue dark:hover:text-hit-yellow mb-6 transition-colors text-xs">
        <FiArrowLeft size={14} /> назад
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-[4/5] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">
          {product.image ? (
            <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-16">
              <img src="/hit-logo.png" alt="ФК Хіт" className="w-32 h-40 object-contain opacity-20" />
            </div>
          )}
        </div>

        <div className="py-2 md:py-6">
          {product.Category && (
            <p className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest mb-2">
              {product.Category.name}
            </p>
          )}
          <h1 className="font-heading font-bold text-2xl text-gray-900 dark:text-white leading-tight">{product.name}</h1>
          <p className="text-hit-blue dark:text-hit-yellow font-heading font-bold text-2xl mt-3">
            {Number(product.price).toLocaleString()} ₴
          </p>

          {product.description && (
            <p className="text-gray-500 dark:text-white/50 mt-5 leading-relaxed text-sm">{product.description}</p>
          )}

          {hasSizes && (
            <div className="mt-5">
              <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-wider mb-2">розмір</p>
              <div className="flex flex-wrap gap-2">
                {sizeKeys.map((size) => {
                  const qty = sizesObj[size];
                  const outOfStock = qty !== null && qty <= 0;
                  return (
                    <button
                      key={size}
                      onClick={() => !outOfStock && setSelectedSize(size)}
                      disabled={outOfStock}
                      className={`min-w-[40px] h-10 px-2 rounded-xl text-xs font-medium transition-all duration-300 relative ${
                        outOfStock
                          ? 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-300 dark:text-white/20 cursor-not-allowed line-through'
                          : selectedSize === size
                            ? 'bg-hit-yellow text-[#0a0e1a] shadow-[0_0_12px_rgba(255,229,0,0.25)]'
                            : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-gray-300 dark:hover:border-white/30'
                      }`}
                    >
                      {size}
                      {qty !== null && !outOfStock && qty <= 3 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">{qty}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-7">
            <button onClick={handleAddToCart} className="btn-primary flex items-center gap-2">
              <FiShoppingCart size={15} /> в кошик
            </button>
          </div>

          <div className="mt-4 text-xs">
            {hasSizes && selectedSize && sizesObj[selectedSize] !== null ? (
              sizesObj[selectedSize] > 0 ? (
                <span className="text-green-500 dark:text-green-400/80">● в наявності ({sizesObj[selectedSize]} шт)</span>
              ) : (
                <span className="text-red-500 dark:text-red-400/80">● немає в цьому розмірі</span>
              )
            ) : product.stock > 0 ? (
              <span className="text-green-500 dark:text-green-400/80">● в наявності</span>
            ) : (
              <span className="text-red-500 dark:text-red-400/80">● немає</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
