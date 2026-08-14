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
  const [printNumber, setPrintNumber] = useState('');
  const [printName, setPrintName] = useState('');
  const [activeTab, setActiveTab] = useState('description');
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
      <div className="pt-24 max-w-[1320px] mx-auto px-5">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-50 dark:bg-hit-navy/50 rounded-2xl"></div>
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
      <div className="pt-24 max-w-[1320px] mx-auto px-5 py-20 text-center">
        <p className="text-hit-muted dark:text-hit-cream/40">Товар не знайдено</p>
        <Link to="/catalog" className="btn-primary mt-4 inline-block">Каталог</Link>
      </div>
    );
  }

  const rawSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
  const sizesObj = Array.isArray(rawSizes)
    ? rawSizes.reduce((obj, s) => ({ ...obj, [s]: null }), {})
    : (rawSizes || {});
  const sizeKeys = Object.keys(sizesObj);
  const hasSizes = sizeKeys.length > 0;

  const characteristics = product.characteristics || null;
  const sizeChart = product.sizeChart || null;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      toast.error('Оберіть розмір');
      return;
    }
    if (hasSizes && sizesObj[selectedSize] !== null && sizesObj[selectedSize] <= 0) {
      toast.error('Цього розміру немає в наявності');
      return;
    }
    if (product.printNumberEnabled && !String(printNumber).trim()) {
      toast.error('Вкажіть номер для набивки');
      return;
    }
    if (product.printNameEnabled && !String(printName).trim()) {
      toast.error('Вкажіть текст для набивки');
      return;
    }
    addItem(
      { id: product.id, name: product.name, price: Number(product.price), image: product.image },
      selectedSize,
      {
        printNumber: product.printNumberEnabled ? String(printNumber).trim() : '',
        printName: product.printNameEnabled ? String(printName).trim() : '',
        printNumberEnabled: !!product.printNumberEnabled,
        printNameEnabled: !!product.printNameEnabled,
      }
    );
    toast.success('Додано в кошик');
  };

  const tabs = [
    { id: 'description', label: 'Опис' },
    { id: 'characteristics', label: 'Характеристики' },
    ...(sizeChart ? [{ id: 'sizeChart', label: 'Розмірна сітка' }] : []),
  ];

  return (
    <div className="pt-24 max-w-[1320px] mx-auto px-5 pb-16">
      <Link to="/catalog" className="inline-flex items-center gap-1.5 text-hit-muted dark:text-hit-cream/40 hover:text-hit-blue-700 dark:hover:text-hit-gold mb-6 transition-colors text-xs font-medium">
        <FiArrowLeft size={14} /> Назад до каталогу
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square bg-gray-50 dark:bg-hit-navy/50 border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden flex items-center justify-center">
          {product.image ? (
            <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-contain p-6" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-16">
              <img src="/hit-logo.png" alt="ФК ХІТ" className="w-32 h-32 object-contain opacity-15" />
            </div>
          )}
        </div>

        <div className="py-2 md:py-6">
          {product.Category && (
            <p className="font-heading font-semibold text-[10px] uppercase tracking-[.2em] text-hit-gold mb-2">
              {product.Category.name}
            </p>
          )}
          <h1 className="font-heading font-bold text-2xl text-hit-ink dark:text-hit-cream leading-tight">{product.name}</h1>
          <p className="font-heading font-bold text-2xl text-hit-ink dark:text-hit-gold mt-3">
            {Number(product.price).toLocaleString('uk-UA')} ₴
          </p>

          {hasSizes && (
            <div className="mt-6">
              <p className="text-hit-muted dark:text-hit-cream/50 text-xs uppercase tracking-wider font-medium mb-2">Розмір</p>
              <div className="flex flex-wrap gap-2">
                {sizeKeys.map((size) => {
                  const qty = sizesObj[size];
                  const outOfStock = qty !== null && qty <= 0;
                  return (
                    <button
                      key={size}
                      onClick={() => !outOfStock && setSelectedSize(size)}
                      disabled={outOfStock}
                      className={`min-w-[44px] h-11 px-3 rounded-xl text-xs font-medium transition-all duration-300 relative ${
                        outOfStock
                          ? 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-300 dark:text-white/20 cursor-not-allowed line-through'
                          : selectedSize === size
                            ? 'bg-hit-gold text-hit-blue font-bold shadow-[0_4px_12px_rgba(230,184,76,0.3)]'
                            : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-hit-ink dark:text-hit-cream/60 hover:border-hit-gold/40'
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

          {(product.printNumberEnabled || product.printNameEnabled) && (
            <div className="mt-6 space-y-3">
              <p className="text-hit-muted dark:text-hit-cream/50 text-xs uppercase tracking-wider font-medium">Набивка</p>
              {product.printNumberEnabled && (
                <div>
                  <label className="block text-hit-muted dark:text-hit-cream/40 text-[11px] mb-1">Номер</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={printNumber}
                    onChange={(e) => setPrintNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                    className="w-full max-w-[140px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-hit-ink dark:text-hit-cream text-sm focus:border-hit-gold focus:outline-none"
                    placeholder="напр. 10"
                  />
                </div>
              )}
              {product.printNameEnabled && (
                <div>
                  <label className="block text-hit-muted dark:text-hit-cream/40 text-[11px] mb-1">Текст</label>
                  <input
                    type="text"
                    value={printName}
                    onChange={(e) => setPrintName(e.target.value.slice(0, 20))}
                    className="w-full max-w-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-hit-ink dark:text-hit-cream text-sm focus:border-hit-gold focus:outline-none uppercase"
                    placeholder="текст набивки"
                  />
                </div>
              )}
            </div>
          )}

          <div className="mt-7 flex items-center gap-4">
            <button onClick={handleAddToCart} className="btn-primary flex items-center gap-2">
              <FiShoppingCart size={15} /> В кошик
            </button>
            <div className="text-xs">
              {hasSizes && selectedSize && sizesObj[selectedSize] !== null ? (
                sizesObj[selectedSize] > 0 ? (
                  <span className="text-green-600 dark:text-green-400">● В наявності ({sizesObj[selectedSize]} шт)</span>
                ) : (
                  <span className="text-red-500 dark:text-red-400">● Немає в цьому розмірі</span>
                )
              ) : product.stock > 0 ? (
                <span className="text-green-600 dark:text-green-400">● В наявності</span>
              ) : (
                <span className="text-red-500 dark:text-red-400">● Немає в наявності</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex gap-1 border-b border-gray-100 dark:border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-hit-ink dark:text-hit-cream'
                  : 'text-hit-muted dark:text-hit-cream/40 hover:text-hit-ink dark:hover:text-hit-cream/70'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-hit-gold rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'description' && (
            <div className="max-w-2xl">
              {product.description ? (
                <p className="text-hit-ink/80 dark:text-hit-cream/70 text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              ) : (
                <p className="text-hit-muted dark:text-hit-cream/40 text-sm">Опис відсутній</p>
              )}
            </div>
          )}

          {activeTab === 'characteristics' && (
            <div className="max-w-2xl">
              {characteristics && Object.keys(characteristics).length > 0 ? (
                <div className="space-y-0 divide-y divide-gray-100 dark:divide-white/5">
                  {Object.entries(characteristics).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-3">
                      <span className="text-hit-muted dark:text-hit-cream/50 text-sm">{key}</span>
                      <span className="text-hit-ink dark:text-hit-cream text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-hit-muted dark:text-hit-cream/40 text-sm">Характеристики не вказані</p>
              )}
            </div>
          )}

          {activeTab === 'sizeChart' && sizeChart && (
            <div className="overflow-x-auto">
              <table className="w-full max-w-2xl text-sm">
                <thead>
                  <tr>
                    {sizeChart.headers.map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-hit-muted dark:text-hit-cream/50 font-medium text-xs uppercase tracking-wider border-b border-gray-100 dark:border-white/5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.rows.map((row, rIdx) => (
                    <tr key={rIdx} className={`${hasSizes && selectedSize === row[0] ? 'bg-hit-gold/10' : ''}`}>
                      {row.map((cell, idx) => (
                        <td key={idx} className={`py-3 px-3 border-b border-gray-50 dark:border-white/5 ${idx === 0 ? 'font-heading font-bold text-hit-ink dark:text-hit-cream' : 'text-hit-ink/70 dark:text-hit-cream/60'}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-hit-muted dark:text-hit-cream/40 text-xs mt-4">
                * Розміри вказані в сантиметрах. Можливе відхилення ±2 см.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
