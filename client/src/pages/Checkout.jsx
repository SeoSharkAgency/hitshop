import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
  });

  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCities, setShowCities] = useState(false);

  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showWarehouses, setShowWarehouses] = useState(false);

  const [deliveryCost, setDeliveryCost] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState(null);

  const cityRef = useRef(null);
  const warehouseRef = useRef(null);
  const cityTimeout = useRef(null);
  const warehouseTimeout = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (cityRef.current && !cityRef.current.contains(e.target)) setShowCities(false);
      if (warehouseRef.current && !warehouseRef.current.contains(e.target)) setShowWarehouses(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (cityQuery.length < 2 || selectedCity) {
      setCities([]);
      return;
    }
    if (cityTimeout.current) clearTimeout(cityTimeout.current);
    cityTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/novaposhta/cities?q=${encodeURIComponent(cityQuery)}`);
        setCities(res.data);
        setShowCities(true);
      } catch { setCities([]); }
    }, 300);
  }, [cityQuery, selectedCity]);

  useEffect(() => {
    if (!selectedCity) { setWarehouses([]); return; }
    if (warehouseTimeout.current) clearTimeout(warehouseTimeout.current);
    warehouseTimeout.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ cityRef: selectedCity.ref });
        if (warehouseQuery) params.append('q', warehouseQuery);
        const res = await api.get(`/novaposhta/warehouses?${params}`);
        setWarehouses(res.data);
        setShowWarehouses(true);
      } catch { setWarehouses([]); }
    }, 300);
  }, [selectedCity, warehouseQuery]);

  useEffect(() => {
    if (!selectedCity || !selectedWarehouse) {
      setDeliveryCost(null);
      setDeliveryDate(null);
      return;
    }
    (async () => {
      try {
        const res = await api.post('/novaposhta/price', {
          cityRecipient: selectedCity.ref,
          cost: String(totalPrice),
          weight: '0.5',
        });
        setDeliveryCost(res.data.cost);
        setDeliveryDate(res.data.estimatedDate);
      } catch { setDeliveryCost(null); }
    })();
  }, [selectedCity, selectedWarehouse, totalPrice]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCityQuery(city.name);
    setShowCities(false);
    setSelectedWarehouse(null);
    setWarehouseQuery('');
    setDeliveryCost(null);
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
      toast.error("вкажи ім'я та телефон");
      return;
    }
    if (!selectedCity || !selectedWarehouse) {
      toast.error('оберіть місто та відділення Нової Пошти');
      return;
    }
    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.id, quantity: item.quantity, size: item.size,
      }));
      const orderData = {
        ...form,
        deliveryAddress: `${selectedCity.name}, ${selectedWarehouse.description}`,
        deliveryCityRef: selectedCity.ref,
        deliveryWarehouseRef: selectedWarehouse.ref,
        deliveryCost: deliveryCost || 0,
        items: orderItems,
      };
      const res = await api.post('/orders', orderData);
      clearCart();
      navigate(`/order/${res.data.orderNumber}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'щось не так 😕');
      setLoading(false);
    }
  };

  if (items.length === 0) { navigate('/cart'); return null; }

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-white/30 focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none transition-all";
  const grandTotal = totalPrice + (deliveryCost || 0);

  return (
    <div className="pt-24 max-w-lg mx-auto px-4 pb-16">
      <h1 className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-6">Оформлення</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
          <p className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest mb-1">контакти</p>
          <input type="text" name="customerName" value={form.customerName} onChange={handleChange} required className={inputClass} placeholder="ім'я" />
          <input type="tel" name="customerPhone" value={form.customerPhone} onChange={handleChange} required className={inputClass} placeholder="телефон" />
          <input type="email" name="customerEmail" value={form.customerEmail} onChange={handleChange} className={inputClass} placeholder="email" />
        </div>

        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
          <p className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest mb-1">доставка Нова Пошта</p>

          <div className="relative" ref={cityRef}>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
              onFocus={() => cities.length > 0 && setShowCities(true)}
              className={inputClass}
              placeholder="місто"
            />
            {showCities && cities.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {cities.map((city) => (
                  <button
                    key={city.ref}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={warehouseRef}>
            <input
              type="text"
              value={warehouseQuery}
              onChange={(e) => { setWarehouseQuery(e.target.value); setSelectedWarehouse(null); }}
              onFocus={() => warehouses.length > 0 && setShowWarehouses(true)}
              disabled={!selectedCity}
              className={`${inputClass} ${!selectedCity ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder={selectedCity ? 'відділення або поштомат' : 'спершу оберіть місто'}
            />
            {showWarehouses && warehouses.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {warehouses.map((wh) => (
                  <button
                    key={wh.ref}
                    type="button"
                    onClick={() => handleWarehouseSelect(wh)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {wh.description}
                  </button>
                ))}
              </div>
            )}
          </div>

          {deliveryCost !== null && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-400 dark:text-white/40 text-xs">вартість доставки</span>
              <span className="text-gray-900 dark:text-white text-sm font-medium">{deliveryCost} ₴</span>
            </div>
          )}
          {deliveryDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 dark:text-white/40 text-xs">орієнтовна дата</span>
              <span className="text-gray-500 dark:text-white/50 text-xs">{deliveryDate}</span>
            </div>
          )}

          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className={`${inputClass} resize-none`} placeholder="коментар" />
        </div>

        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
          <p className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest mb-3">замовлення</p>
          <div className="space-y-1.5">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-white/50 truncate mr-3">
                  {item.name} {item.size && `• ${item.size}`} × {item.quantity}
                </span>
                <span className="text-gray-900 dark:text-white flex-shrink-0">{(item.price * item.quantity).toLocaleString()} ₴</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-white/10 mt-3 pt-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 dark:text-white/40">товари</span>
              <span className="text-gray-900 dark:text-white">{totalPrice.toLocaleString()} ₴</span>
            </div>
            {deliveryCost !== null && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 dark:text-white/40">доставка</span>
                <span className="text-gray-900 dark:text-white">{deliveryCost} ₴</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1.5 border-t border-gray-200 dark:border-white/10">
              <span className="text-gray-400 dark:text-white/40 text-xs">разом</span>
              <span className="font-heading font-bold text-lg text-hit-blue dark:text-hit-yellow">
                {grandTotal.toLocaleString()} ₴
              </span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'зачекай...' : 'замовити'}
        </button>
      </form>
    </div>
  );
}
