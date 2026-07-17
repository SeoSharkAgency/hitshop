import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiTruck, FiPackage, FiXCircle } from 'react-icons/fi';
import api, { getImageUrl } from '../api';

const STATUS_MAP = {
  new: { label: 'Нове', icon: FiClock, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' },
  processing: { label: 'В обробці', icon: FiPackage, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/20' },
  shipped: { label: 'Відправлено', icon: FiTruck, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/20' },
  delivered: { label: 'Доставлено', icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/20' },
  cancelled: { label: 'Скасовано', icon: FiXCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20' },
};

const PAYMENT_MAP = {
  pending: { label: 'Очікує оплати', color: 'text-yellow-600 dark:text-yellow-400' },
  paid: { label: 'Оплачено', color: 'text-green-600 dark:text-green-400' },
  failed: { label: 'Відхилено', color: 'text-red-500' },
  refunded: { label: 'Повернено', color: 'text-gray-500' },
};

export default function OrderStatus() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/orders/track/${orderNumber}`)
      .then(res => setOrder(res.data))
      .catch(() => setError('Замовлення не знайдено'))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) return (
    <div className="pt-24 max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-gray-400 dark:text-white/40">Завантаження...</p>
    </div>
  );

  if (error) return (
    <div className="pt-24 max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-3">Не знайдено</h1>
      <p className="text-gray-500 dark:text-white/50 text-sm mb-6">Замовлення з номером {orderNumber} не існує</p>
      <Link to="/" className="btn-primary">На головну</Link>
    </div>
  );

  const status = STATUS_MAP[order.status] || STATUS_MAP.new;
  const payment = PAYMENT_MAP[order.paymentStatus] || PAYMENT_MAP.pending;
  const StatusIcon = status.icon;

  return (
    <div className="pt-24 max-w-lg mx-auto px-4 pb-16">
      <div className="text-center mb-8">
        <div className={`w-16 h-16 rounded-full ${status.bg} flex items-center justify-center mx-auto mb-4`}>
          <StatusIcon size={28} className={status.color} />
        </div>
        <h1 className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-1">
          Замовлення {order.orderNumber}
        </h1>
        <p className={`text-sm font-medium ${status.color}`}>{status.label}</p>
        <p className="text-gray-400 dark:text-white/30 text-xs mt-1">
          від {new Date(order.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {order.paymentStatus === 'pending' && order.status !== 'cancelled' && (
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-2xl p-5 mb-5">
          <h3 className="font-heading font-semibold text-gray-900 dark:text-white text-sm mb-3">Реквізити для оплати</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-white/50">Одержувач:</span>
              <span className="text-gray-900 dark:text-white font-medium">{import.meta.env.VITE_PAYMENT_RECIPIENT || 'ФК ХІТ Київ'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-white/50">IBAN:</span>
              <span className="text-gray-900 dark:text-white font-mono text-xs">{import.meta.env.VITE_PAYMENT_IBAN || 'UA000000000000000000000000000'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-white/50">ЄДРПОУ:</span>
              <span className="text-gray-900 dark:text-white font-medium">{import.meta.env.VITE_PAYMENT_EDRPOU || '00000000'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-white/50">Призначення:</span>
              <span className="text-gray-900 dark:text-white font-medium">Оплата за замовлення {order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-yellow-200 dark:border-yellow-500/20 mt-2">
              <span className="text-gray-500 dark:text-white/50">Сума:</span>
              <span className="font-heading font-bold text-lg text-hit-blue dark:text-hit-yellow">{Number(order.total).toLocaleString('uk-UA')} ₴</span>
            </div>
          </div>
        </div>
      )}

      {order.paymentStatus === 'paid' && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-4 mb-5 text-center">
          <FiCheckCircle className="inline text-green-500 mr-2" size={16} />
          <span className="text-green-700 dark:text-green-400 text-sm font-medium">Оплату отримано</span>
        </div>
      )}

      {order.ttnNumber && (
        <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-white/50 text-xs">Номер ТТН</p>
              <p className="text-gray-900 dark:text-white font-mono font-medium">{order.ttnNumber}</p>
            </div>
            <a
              href={`https://novaposhta.ua/tracking/?cargo_number=${order.ttnNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs"
            >
              Відстежити
            </a>
          </div>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 mb-5">
        <p className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest mb-3">Ваше замовлення</p>
        <div className="space-y-3">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.Product?.image ? (
                  <img src={getImageUrl(item.Product.image)} alt="" className="w-full h-full object-contain p-1" />
                ) : (
                  <img src="/hit-logo.png" alt="" className="w-5 h-6 object-contain opacity-20" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white text-sm truncate">{item.Product?.name || 'Товар'}</p>
                <p className="text-gray-400 dark:text-white/40 text-xs">
                  {item.size && `${item.size} • `}{item.quantity} шт × {Number(item.price).toLocaleString()} ₴
                </p>
              </div>
              <span className="text-gray-900 dark:text-white text-sm font-medium flex-shrink-0">
                {(item.price * item.quantity).toLocaleString()} ₴
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-white/10 mt-4 pt-3 space-y-1.5">
          {order.deliveryCost > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 dark:text-white/40">доставка</span>
              <span className="text-gray-900 dark:text-white">{Number(order.deliveryCost).toLocaleString()} ₴</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 dark:text-white/40 text-xs">разом</span>
            <span className="font-heading font-bold text-lg text-hit-blue dark:text-hit-yellow">{Number(order.total).toLocaleString('uk-UA')} ₴</span>
          </div>
        </div>
      </div>

      {order.deliveryAddress && (
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest mb-2">доставка</p>
          <p className="text-gray-900 dark:text-white text-sm">{order.deliveryAddress}</p>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 mb-5">
        <p className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest mb-2">статус оплати</p>
        <p className={`text-sm font-medium ${payment.color}`}>{payment.label}</p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link to="/catalog" className="btn-primary">Ще мерч</Link>
        <Link to="/" className="btn-secondary">На головну</Link>
      </div>
    </div>
  );
}
