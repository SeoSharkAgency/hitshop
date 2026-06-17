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
    <div className="pt-24 max-w-6xl mx-auto px-4 pb-16">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-gray-900 dark:text-white">Каталог</h1>
        <p className="text-gray-400 dark:text-white/40 text-sm mt-1">обирай свій стиль</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
            !activeCategory
              ? 'bg-hit-yellow text-[#0a0e1a] shadow-[0_0_12px_rgba(255,229,0,0.25)]'
              : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30'
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
                ? 'bg-hit-yellow text-[#0a0e1a] shadow-[0_0_12px_rgba(255,229,0,0.25)]'
                : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30'
            }`}
          >
            {cat.name.toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[4/5] bg-gray-100 dark:bg-white/5"></div>
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full w-3/4"></div>
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <img src="/hit-logo.png" alt="" className="w-14 h-16 object-contain mx-auto mb-4 opacity-15" />
          <p className="text-gray-400 dark:text-white/40 text-sm">тут поки нічого</p>
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
