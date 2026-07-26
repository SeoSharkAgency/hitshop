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
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-hit-blue">
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/pattern-dark-seamless.jpg)', backgroundSize: '900px', backgroundRepeat: 'repeat', opacity: 0.26 }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(230,184,76,0.08),transparent_70%)]"></div>

        <div className="max-w-[1320px] mx-auto px-5 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="flex-1 text-center md:text-left">
              <p className="font-heading font-semibold text-[10px] uppercase tracking-[.2em] text-hit-gold mb-3">
                Офіційний магазин
              </p>
              <h1 className="font-heading font-extrabold text-3xl md:text-5xl text-hit-cream leading-tight uppercase">
                ФК ХІТ<br />SHOP
              </h1>
              <p className="text-hit-cream/60 text-sm md:text-base mt-4 max-w-md mx-auto md:mx-0 leading-relaxed">
                Ігрова форма сезону 2025/26, тренувальний одяг та клубна атрибутика. Одягни кольори чемпіонів.
              </p>
              <div className="flex flex-wrap gap-3 mt-8 justify-center md:justify-start">
                <Link to="/catalog" className="btn-primary">Перейти в магазин →</Link>
              </div>
            </div>
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-hit-gold/10 rounded-full blur-3xl scale-110"></div>
              <img src="/hit-logo.png" alt="ФК ХІТ" className="w-40 h-40 md:w-56 md:h-56 object-contain relative z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-[1320px] mx-auto px-5 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-heading font-semibold text-[10px] uppercase tracking-[.2em] text-hit-gold mb-1">Popular</p>
            <h2 className="font-heading font-bold text-xl md:text-2xl text-hit-ink dark:text-hit-cream uppercase">
              Хіти продажів
            </h2>
          </div>
          <Link to="/catalog" className="font-heading font-semibold text-sm uppercase tracking-wider text-hit-blue-700 dark:text-hit-gold hover:text-hit-gold transition-colors hidden sm:block">
            Усі товари →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-hit-blue/40 rounded-2xl animate-pulse overflow-hidden border border-gray-100 dark:border-white/5">
                <div className="aspect-square bg-gray-50 dark:bg-hit-navy/50"></div>
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

        <div className="text-center mt-8 sm:hidden">
          <Link to="/catalog" className="btn-primary">Весь каталог</Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[1320px] mx-auto px-5 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-hit-blue/30 border border-gray-100 dark:border-white/5 rounded-2xl p-6">
            <span className="text-2xl">⚡</span>
            <h3 className="font-heading font-bold text-hit-ink dark:text-hit-cream text-sm mt-3">Швидка доставка</h3>
            <p className="text-hit-muted dark:text-hit-cream/40 text-xs mt-1">Нова Пошта, 1-3 дні</p>
          </div>
          <div className="bg-gray-50 dark:bg-hit-blue/30 border border-gray-100 dark:border-white/5 rounded-2xl p-6">
            <span className="text-2xl">🏆</span>
            <h3 className="font-heading font-bold text-hit-ink dark:text-hit-cream text-sm mt-3">Оригінал</h3>
            <p className="text-hit-muted dark:text-hit-cream/40 text-xs mt-1">Офіційна продукція клубу</p>
          </div>
          <div className="bg-gray-50 dark:bg-hit-blue/30 border border-gray-100 dark:border-white/5 rounded-2xl p-6">
            <span className="text-2xl">💛</span>
            <h3 className="font-heading font-bold text-hit-ink dark:text-hit-cream text-sm mt-3">Для клубу</h3>
            <p className="text-hit-muted dark:text-hit-cream/40 text-xs mt-1">Кожна покупка — підтримка ФК «ХІТ»</p>
          </div>
        </div>
      </section>
    </div>
  );
}
