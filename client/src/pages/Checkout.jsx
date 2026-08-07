import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
  });

  const cityDropdownRef = useRef(null);
  const warehouseDropdownRef = useRef(null);

  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCities, setShowCities] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);

  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.name || '',
        customerPhone: prev.customerPhone || user.phone || '',
        customerEmail: prev.customerEmail || user.email || '',
      }));
      if (user.deliveryCity && !selectedCity) {
        setCityQuery(user.deliveryCity);
      }
      if (user.deliveryWarehouse && !selectedWarehouse) {
        setWarehouseQuery(user.deliveryWarehouse);
      }
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) setShowCities(false);
      if (warehouseDropdownRef.current && !warehouseDropdownRef.current.contains(e.target)) setShowWarehouses(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCities = useCallback(async (q) => {
    if (q.length < 2) { setCities([]); return; }
    setCityLoading(true);
    try {
      const res = await api.get(`/novaposhta/cities?q=${encodeURIComponent(q)}`);
      setCities(res.data);
    } catch { setCities([]); }
    setCityLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (cityQuery.length >= 2 && !selectedCity) {
        searchCities(cityQuery);
        setShowCities(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery, selectedCity, searchCities]);

  const searchWarehouses = useCallback(async (cityRef, q) => {
    if (!cityRef) return;
    setWarehouseLoading(true);
    try {
      const params = new URLSearchParams({ cityRef });
      if (q) params.set('q', q);
      const res = await api.get(`/novaposhta/warehouses?${params}`);
      setWarehouses(res.data);
    } catch { setWarehouses([]); }
    setWarehouseLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCity) {
      const timer = setTimeout(() => {
        searchWarehouses(selectedCity.ref, warehouseQuery);
        if (warehouseQuery || !selectedWarehouse) setShowWarehouses(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedCity, warehouseQuery, searchWarehouses]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCityQuery(city.name);
    setShowCities(false);
    setSelectedWarehouse(null);
    setWarehouseQuery('');
    setWarehouses([]);
    searchWarehouses(city.ref, '');
  };

  const handleWarehouseSelect = (wh) => {
    setSelectedWarehouse(wh);
    setWarehouseQuery(wh.description);
    setShowWarehouses(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone) {
      toast.error("Вкажіть ім'я та телефон");
      return;
    }
    if (!selectedCity || !selectedWarehouse) {
      toast.error('Оберіть місто та відділення Нової Пошти');
      return;
    }
    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.id, quantity: item.quantity, size: item.size,
      }));
      const orderData = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        deliveryAddress: `${selectedCity.name}, ${selectedWarehouse.description}`,
        deliveryCityRef: selectedCity.ref,
        deliveryWarehouseRef: selectedWarehouse.ref,
        city: selectedCity.name,
        warehouseNumber: selectedWarehouse.description,
        notes: form.notes,
        items: orderItems,
      };
      const res = await api.post('/orders', orderData, {
        headers: localStorage.getItem('userToken')
          ? { Authorization: `Bearer ${localStorage.getItem('userToken')}` }
          : {},
      });
      clearCart();
      navigate(`/order/${res.data.orderNumber}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Помилка оформлення');
      setLoading(false);
    }
  };

  if (items.length === 0) { navigate('/cart'); return null; }

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-hit-ink dark:text-hit-cream text-sm placeholder-hit-muted dark:placeholder-hit-cream/30 focus:border-hit-gold focus:outline-none transition-all";

  return (
    <div className="pt-24 max-w-lg mx-auto px-5 pb-16">
      <h1 className="font-heading font-bold text-2xl text-hit-ink dark:text-hit-cream mb-6">Оформлення</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white dark:bg-hit-blue/40 border border-gray-100 dark:border-white/5 rounded-2xl p-5 space-y-3">
          <p className="text-hit-muted dark:text-hit-cream/40 text-xs uppercase tracking-widest mb-1">Контакти</p>
          <input type="text" name="customerName" value={form.customerName} onChange={handleChange} required className={inputClass} placeholder="Ім'я" />
          <input type="tel" name="customerPhone" value={form.customerPhone} onChange={handleChange} required className={inputClass} placeholder="Телефон" />
          <input type="email" name="customerEmail" value={form.customerEmail} onChange={handleChange} className={inputClass} placeholder="Email (для підтвердження)" />
        </div>

        <div className="bg-white dark:bg-hit-blue/40 border border-gray-100 dark:border-white/5 rounded-2xl p-5 space-y-3">
          <p className="text-hit-muted dark:text-hit-cream/40 text-xs uppercase tracking-widest mb-1">Доставка Нова Пошта</p>

          {/* City search */}
          <div className="relative" ref={cityDropdownRef}>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
              onFocus={() => { if (cities.length > 0) setShowCities(true); }}
              className={inputClass}
              placeholder="Почніть вводити місто..."
            />
            {cityLoading && <span className="absolute right-3 top-3 text-hit-muted text-xs">...</span>}
            {showCities && cities.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-hit-blue border border-gray-200 dark:border-white/10 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {cities.map((city) => (
                  <button
                    key={city.ref}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="w-full text-left px-4 py-2.5 text-sm text-hit-ink dark:text-hit-cream hover:bg-hit-gold/10 transition-colors"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Warehouse search */}
          <div className="relative" ref={warehouseDropdownRef}>
            <input
              type="text"
              value={warehouseQuery}
              onChange={(e) => { setWarehouseQuery(e.target.value); setSelectedWarehouse(null); }}
              onFocus={() => { if (warehouses.length > 0) setShowWarehouses(true); }}
              disabled={!selectedCity}
              className={`${inputClass} ${!selectedCity ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder={selectedCity ? 'Оберіть відділення або поштомат...' : 'Спочатку оберіть місто'}
            />
            {warehouseLoading && <span className="absolute right-3 top-3 text-hit-muted text-xs">...</span>}
            {showWarehouses && warehouses.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-hit-blue border border-gray-200 dark:border-white/10 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {warehouses.map((wh) => (
                  <button
                    key={wh.ref}
                    type="button"
                    onClick={() => handleWarehouseSelect(wh)}
                    className="w-full text-left px-4 py-2.5 text-sm text-hit-ink dark:text-hit-cream hover:bg-hit-gold/10 transition-colors"
                  >
                    {wh.description}
                  </button>
                ))}
              </div>
            )}
          </div>

          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className={`${inputClass} resize-none`} placeholder="Коментар (необов'язково)" />
        </div>

        <div className="bg-white dark:bg-hit-blue/40 border border-gray-100 dark:border-white/5 rounded-2xl p-5">
          <p className="text-hit-muted dark:text-hit-cream/40 text-xs uppercase tracking-widest mb-3">Замовлення</p>
          <div className="space-y-1.5">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex justify-between text-xs">
                <span className="text-hit-muted dark:text-hit-cream/50 truncate mr-3">
                  {item.name} {item.size && `• ${item.size}`} × {item.quantity}
                </span>
                <span className="text-hit-ink dark:text-hit-cream flex-shrink-0">{(item.price * item.quantity).toLocaleString()} ₴</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-white/5 mt-3 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-hit-muted dark:text-hit-cream/40 text-xs">Разом</span>
              <span className="font-heading font-bold text-lg text-hit-ink dark:text-hit-gold">
                {totalPrice.toLocaleString('uk-UA')} ₴
              </span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Оформлення...' : 'Замовити'}
        </button>
      </form>
    </div>
  );
}
