import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../api';
import { getImageUrl } from '../api';

const STATUS_LABELS = {
  new: 'Нове',
  processing: 'В обробці',
  shipped: 'Відправлено',
  delivered: 'Доставлено',
  cancelled: 'Скасовано',
};

const PAYMENT_LABELS = {
  pending: 'Очікує оплати',
  paid: 'Оплачено',
  failed: 'Помилка',
  refunded: 'Повернуто',
};

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
};

export default function UserCabinet() {
  const { user, logout, updateProfile } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [tab, setTab] = useState('orders');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', deliveryCity: '', deliveryWarehouse: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || '', phone: user.phone || '', deliveryCity: user.deliveryCity || '', deliveryWarehouse: user.deliveryWarehouse || '' });
    const token = localStorage.getItem('userToken');
    api.get('/user/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoadingOrders(false));
  }, [user]);

  if (!user) {
    navigate('/account/login');
    return null;
  }

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileForm);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="pt-24 pb-16 max-w-[1320px] mx-auto px-5">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-64 shrink-0">
          <div className="bg-white dark:bg-hit-blue/40 rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-hit-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-heading font-bold text-hit-gold text-xl">{user.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <p className="font-heading font-bold text-hit-ink dark:text-hit-cream text-sm">{user.name}</p>
              <p className="text-hit-muted dark:text-hit-cream/50 text-xs mt-0.5">{user.email}</p>
            </div>
            <nav className="space-y-1 mt-4">
              <button
                onClick={() => setTab('orders')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === 'orders' ? 'bg-hit-gold/10 text-hit-gold' : 'text-hit-muted dark:text-hit-cream/60 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                Мої замовлення
              </button>
              <button
                onClick={() => setTab('profile')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === 'profile' ? 'bg-hit-gold/10 text-hit-gold' : 'text-hit-muted dark:text-hit-cream/60 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                Профіль
              </button>
            </nav>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full mt-4 text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              Вийти
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'orders' && (
            <div>
              <h1 className="font-heading font-bold text-xl text-hit-ink dark:text-hit-cream mb-6">Мої замовлення</h1>
              {loadingOrders ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-hit-blue/40 rounded-2xl p-5 border border-gray-100 dark:border-white/5 animate-pulse">
                      <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-1/3 mb-3"></div>
                      <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16">
                  <img src="/hit-logo.png" alt="" className="w-14 h-14 object-contain mx-auto mb-4 opacity-15" />
                  <p className="text-hit-muted dark:text-hit-cream/40 text-sm mb-4">У вас ще немає замовлень</p>
                  <Link to="/catalog" className="btn-primary">Перейти в каталог</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/order/${order.orderNumber}`}
                      className="block bg-white dark:bg-hit-blue/40 rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:border-hit-gold/30 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-heading font-bold text-sm text-hit-ink dark:text-hit-cream">{order.orderNumber}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        <span className="text-hit-muted dark:text-hit-cream/40 text-xs">
                          {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex -space-x-2">
                          {order.items?.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-hit-navy/50 border-2 border-white dark:border-hit-blue overflow-hidden flex items-center justify-center">
                              {item.Product?.image ? (
                                <img src={getImageUrl(item.Product.image)} alt="" className="w-full h-full object-contain p-1" />
                              ) : (
                                <img src="/hit-logo.png" alt="" className="w-5 h-5 opacity-20" />
                              )}
                            </div>
                          ))}
                          {order.items?.length > 4 && (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 border-2 border-white dark:border-hit-blue flex items-center justify-center text-[10px] font-bold text-hit-muted">
                              +{order.items.length - 4}
                            </div>
                          )}
                        </div>
                        <div className="ml-auto text-right">
                          <p className="font-heading font-bold text-sm text-hit-ink dark:text-hit-gold">
                            {Number(order.total).toLocaleString('uk-UA')} ₴
                          </p>
                          <p className="text-[10px] text-hit-muted dark:text-hit-cream/40">
                            {PAYMENT_LABELS[order.paymentStatus]}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-50 dark:border-white/5">
                        <span className="text-hit-gold text-xs font-medium">Переглянути статус замовлення →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div>
              <h1 className="font-heading font-bold text-xl text-hit-ink dark:text-hit-cream mb-6">Профіль</h1>
              <form onSubmit={handleProfileSave} className="bg-white dark:bg-hit-blue/40 rounded-2xl p-6 border border-gray-100 dark:border-white/5 max-w-md space-y-4">
                <div>
                  <label className="block text-xs font-medium text-hit-muted dark:text-hit-cream/60 mb-1.5">Ім'я</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-hit-navy/50 text-hit-ink dark:text-hit-cream text-sm focus:outline-none focus:border-hit-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-hit-muted dark:text-hit-cream/60 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-hit-navy/30 text-hit-muted dark:text-hit-cream/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-hit-muted dark:text-hit-cream/60 mb-1.5">Телефон</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-hit-navy/50 text-hit-ink dark:text-hit-cream text-sm focus:outline-none focus:border-hit-gold"
                    placeholder="+380..."
                  />
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                  <p className="text-xs font-medium text-hit-muted dark:text-hit-cream/60 mb-3">Адреса доставки</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-hit-muted dark:text-hit-cream/60 mb-1.5">Місто</label>
                      <input
                        type="text"
                        value={profileForm.deliveryCity}
                        onChange={(e) => setProfileForm({ ...profileForm, deliveryCity: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-hit-navy/50 text-hit-ink dark:text-hit-cream text-sm focus:outline-none focus:border-hit-gold"
                        placeholder="Київ"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-hit-muted dark:text-hit-cream/60 mb-1.5">Відділення Нової Пошти</label>
                      <input
                        type="text"
                        value={profileForm.deliveryWarehouse}
                        onChange={(e) => setProfileForm({ ...profileForm, deliveryWarehouse: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-hit-navy/50 text-hit-ink dark:text-hit-cream text-sm focus:outline-none focus:border-hit-gold"
                        placeholder="№ відділення або поштомату"
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary w-full">
                  {saving ? 'Зберігаю...' : 'Зберегти'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
