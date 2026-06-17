import { useState } from 'react';
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
    deliveryAddress: '',
    notes: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone) {
      toast.error("вкажи ім'я та телефон");
      return;
    }
    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.id, quantity: item.quantity, size: item.size,
      }));
      const res = await api.post('/orders', { ...form, items: orderItems });
      clearCart();

      if (import.meta.env.DEV) {
        navigate(`/order-success/${res.data.id}`);
        return;
      }

      const paymentRes = await api.post('/payments/create', { orderId: res.data.id });

      const wayforpayForm = document.createElement('form');
      wayforpayForm.method = 'POST';
      wayforpayForm.action = 'https://secure.wayforpay.com/pay';
      wayforpayForm.style.display = 'none';
      Object.entries(paymentRes.data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            const input = document.createElement('input');
            input.type = 'hidden'; input.name = `${key}[]`; input.value = v;
            wayforpayForm.appendChild(input);
          });
        } else {
          const input = document.createElement('input');
          input.type = 'hidden'; input.name = key; input.value = value;
          wayforpayForm.appendChild(input);
        }
      });
      document.body.appendChild(wayforpayForm);
      wayforpayForm.submit();
    } catch (err) {
      toast.error(err.response?.data?.error || 'щось не так 😕');
      setLoading(false);
    }
  };

  if (items.length === 0) { navigate('/cart'); return null; }

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-white/30 focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none transition-all";

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
          <p className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest mb-1">доставка</p>
          <input type="text" name="deliveryAddress" value={form.deliveryAddress} onChange={handleChange} className={inputClass} placeholder="місто + нова пошта" />
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
          <div className="border-t border-gray-200 dark:border-white/10 mt-3 pt-3 flex justify-between items-center">
            <span className="text-gray-400 dark:text-white/40 text-xs">разом</span>
            <span className="font-heading font-bold text-lg text-hit-blue dark:text-hit-yellow">
              {totalPrice.toLocaleString()} ₴
            </span>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'зачекай...' : 'оплатити'}
        </button>
      </form>
    </div>
  );
}
