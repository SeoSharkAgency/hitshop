import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?featured=true')
      .then((res) => setFeatured(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-20">
      {/* Hero — compact */}
      <section className="relative py-14 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg.jpg')" }}></div>
        <div className="absolute inset-0 bg-white/80 dark:bg-[#0a0e1a]/80 backdrop-blur-[2px]"></div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-block bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-3.5 py-1 mb-4">
                <span className="text-gray-500 dark:text-white/50 text-xs">фк "хіт" київ • з 2006</span>
              </div>
              <h1 className="font-heading font-black text-3xl md:text-5xl text-gray-900 dark:text-white leading-tight tracking-tight">
                Мерч <span className="text-hit-blue dark:text-hit-yellow">для своїх</span>
              </h1>
              <p className="text-gray-500 dark:text-white/50 text-sm md:text-base mt-4 max-w-sm mx-auto md:mx-0">
                Форма, худі, аксесуари — все що потрібно справжньому фанату
              </p>
              <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                <Link to="/catalog" className="btn-primary">каталог</Link>
                <Link to="/catalog?category=forma" className="btn-secondary">форма</Link>
              </div>
            </div>
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-hit-yellow/15 dark:bg-hit-yellow/20 rounded-full blur-2xl scale-75"></div>
              <img src="/hit-logo.png" alt="ФК Хіт Київ" className="w-36 h-44 md:w-44 md:h-52 object-contain relative z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-hit-blue dark:text-hit-yellow text-xs font-medium uppercase tracking-widest mb-1">popular</p>
            <h2 className="font-heading font-bold text-xl md:text-2xl text-gray-900 dark:text-white">
              Хіти продажів
            </h2>
          </div>
          <Link to="/catalog" className="text-gray-400 hover:text-hit-blue dark:hover:text-hit-yellow transition-colors text-sm hidden sm:block">
            все →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[4/5] bg-gray-100 dark:bg-white/5"></div>
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full w-3/4"></div>
                  <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-6 sm:hidden">
          <Link to="/catalog" className="btn-secondary">весь каталог</Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
            <span className="text-xl">⚡</span>
            <h3 className="font-heading font-bold text-gray-900 dark:text-white text-sm mt-2">Швидка доставка</h3>
            <p className="text-gray-400 dark:text-white/40 text-xs mt-1">Нова Пошта, 1-3 дні</p>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
            <span className="text-xl">🔥</span>
            <h3 className="font-heading font-bold text-gray-900 dark:text-white text-sm mt-2">Оригінал</h3>
            <p className="text-gray-400 dark:text-white/40 text-xs mt-1">Офіційна продукція клубу</p>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
            <span className="text-xl">💛</span>
            <h3 className="font-heading font-bold text-gray-900 dark:text-white text-sm mt-2">Для клубу</h3>
            <p className="text-gray-400 dark:text-white/40 text-xs mt-1">Кожна покупка — підтримка</p>
          </div>
        </div>
      </section>
    </div>
  );
}
