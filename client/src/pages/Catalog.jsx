import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = activeCategory ? `?category=${activeCategory}` : '';
    api.get(`/products${params}`)
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="pt-24 max-w-[1320px] mx-auto px-5 pb-16">
      <div className="mb-8">
        <p className="font-heading font-semibold text-[10px] uppercase tracking-[.2em] text-hit-gold mb-1">Офіційний магазин</p>
        <h1 className="font-heading font-bold text-2xl text-hit-ink dark:text-hit-cream">Каталог</h1>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
            !activeCategory
              ? 'bg-hit-gold text-hit-blue font-bold shadow-[0_4px_12px_rgba(230,184,76,0.3)]'
              : 'bg-gray-50 dark:bg-white/5 text-hit-muted dark:text-hit-cream/50 border border-gray-100 dark:border-white/10 hover:border-hit-gold/40 dark:hover:border-hit-gold/30'
          }`}
        >
          все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSearchParams({ category: cat.slug })}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
              activeCategory === cat.slug
                ? 'bg-hit-gold text-hit-blue font-bold shadow-[0_4px_12px_rgba(230,184,76,0.3)]'
                : 'bg-gray-50 dark:bg-white/5 text-hit-muted dark:text-hit-cream/50 border border-gray-100 dark:border-white/10 hover:border-hit-gold/40 dark:hover:border-hit-gold/30'
            }`}
          >
            {cat.name.toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-hit-blue/40 rounded-2xl animate-pulse overflow-hidden border border-gray-100 dark:border-white/5">
              <div className="aspect-square bg-gray-50 dark:bg-hit-navy/50"></div>
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full w-3/4"></div>
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <img src="/hit-logo.png" alt="" className="w-14 h-14 object-contain mx-auto mb-4 opacity-15" />
          <p className="text-hit-muted dark:text-hit-cream/40 text-sm">Тут поки нічого</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
