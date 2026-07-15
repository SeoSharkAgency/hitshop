import { useState, useEffect } from 'react';
import { FiPackage, FiShoppingBag, FiLogOut, FiPlus, FiEdit2, FiTrash2, FiUsers, FiFileText, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { getImageUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import AnalyticsPanel from '../components/AnalyticsPanel';

const ROLE_LABELS = { admin: 'адмін', accountant: 'бухгалтер', warehouse: 'склад' };

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const role = admin?.role || 'admin';

  const defaultTab = role === 'accountant' ? 'orders' : 'products';
  const [tab, setTab] = useState(defaultTab);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const canProducts = role === 'admin' || role === 'warehouse';
  const canOrders = role === 'admin' || role === 'accountant';
  const canUsers = role === 'admin';
  const canAnalytics = role === 'admin' || role === 'accountant';

  useEffect(() => {
    if (canProducts) { loadProducts(); loadCategories(); }
    if (canOrders) loadOrders();
    if (canUsers) loadUsers();
  }, []);

  const loadProducts = () => api.get('/products').then((r) => setProducts(r.data));
  const loadOrders = () => api.get('/orders').then((r) => setOrders(r.data));
  const loadCategories = () => api.get('/categories').then((r) => setCategories(r.data));
  const loadUsers = () => api.get('/auth/users').then((r) => setUsers(r.data)).catch(() => {});

  const handleDeleteProduct = async (id) => {
    if (!confirm('видалити?')) return;
    try { await api.delete(`/products/${id}`); toast.success('видалено'); loadProducts(); }
    catch { toast.error('помилка'); }
  };

  const handleStatusChange = async (orderId, field, value) => {
    try { await api.put(`/orders/${orderId}`, { [field]: value }); toast.success('оновлено ✓'); loadOrders(); }
    catch { toast.error('помилка'); }
  };

  const handleCreateTTN = async (order) => {
    try {
      const res = await api.post('/novaposhta/create-ttn', {
        orderId: order.id,
        recipientCityRef: order.deliveryCityRef,
        recipientWarehouseRef: order.deliveryWarehouseRef,
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        weight: '0.5',
        cost: String(order.total),
        description: `Замовлення ${order.orderNumber}`,
      });
      if (res.data.ttnNumber) {
        await api.put(`/orders/${order.id}`, { ttnNumber: res.data.ttnNumber, status: 'shipped' });
        toast.success(`ТТН створено: ${res.data.ttnNumber}`);
        loadOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Помилка створення ТТН');
    }
  };

  const pillClass = (active) => `flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
    active
      ? 'bg-hit-yellow text-[#0a0e1a]'
      : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30'
  }`;

  return (
    <div className="pt-24 max-w-6xl mx-auto px-4 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img src="/hit-logo.png" alt="" className="w-7 h-8 object-contain" />
          <div>
            <h1 className="font-heading font-bold text-xl text-gray-900 dark:text-white">admin</h1>
            <span className="text-xs text-gray-400 dark:text-white/40">{admin?.username} — {ROLE_LABELS[role] || role}</span>
          </div>
        </div>
        <button onClick={logout} className="text-gray-400 dark:text-white/40 hover:text-red-400 transition-colors text-xs flex items-center gap-1.5">
          <FiLogOut size={14} /> вийти
        </button>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {canProducts && (
          <button onClick={() => setTab('products')} className={pillClass(tab === 'products')}>
            <FiPackage size={13} /> товари ({products.length})
          </button>
        )}
        {canOrders && (
          <button onClick={() => setTab('orders')} className={pillClass(tab === 'orders')}>
            <FiShoppingBag size={13} /> замовлення ({orders.length})
          </button>
        )}
        {canAnalytics && (
          <button onClick={() => setTab('analytics')} className={pillClass(tab === 'analytics')}>
            <FiBarChart2 size={13} /> аналітика
          </button>
        )}
        {canUsers && (
          <button onClick={() => setTab('users')} className={pillClass(tab === 'users')}>
            <FiUsers size={13} /> користувачі ({users.length})
          </button>
        )}
        {canUsers && (
          <button onClick={() => setTab('logs')} className={pillClass(tab === 'logs')}>
            <FiFileText size={13} /> журнал
          </button>
        )}
      </div>

      {tab === 'products' && canProducts && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <p className="text-gray-400 dark:text-white/40 text-xs">{products.length} товарів</p>
            <button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="btn-primary flex items-center gap-1.5 text-xs">
              <FiPlus size={13} /> додати
            </button>
          </div>

          {showForm && (
            <ProductForm product={editingProduct} categories={categories}
              onClose={() => { setShowForm(false); setEditingProduct(null); }}
              onSaved={() => { setShowForm(false); setEditingProduct(null); loadProducts(); }}
            />
          )}

          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {product.image ? (
                    <img src={getImageUrl(product.image)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <img src="/hit-logo.png" alt="" className="w-6 h-7 object-contain opacity-20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 dark:text-white text-sm font-medium truncate">{product.name}</h3>
                  <p className="text-gray-400 dark:text-white/40 text-xs">
                    {product.Category?.name} • {Number(product.price).toLocaleString()} ₴ • {product.stock} шт
                    {product.sizes && Object.keys(product.sizes).length > 0 && (
                      <span className="ml-1 text-gray-300 dark:text-white/25">
                        ({Object.entries(product.sizes).map(([s, q]) => `${s}:${q}`).join(', ')})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingProduct(product); setShowForm(true); }} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-hit-blue dark:hover:text-hit-yellow transition-colors">
                    <FiEdit2 size={12} />
                  </button>
                  {role === 'admin' && (
                    <button onClick={() => handleDeleteProduct(product.id)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-red-400 transition-colors">
                      <FiTrash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && canOrders && (
        <div>
          {orders.length === 0 ? (
            <p className="text-gray-400 dark:text-white/40 text-sm text-center py-10">замовлень немає</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-heading font-semibold text-gray-900 dark:text-white text-sm">{order.orderNumber}</h3>
                      <p className="text-gray-500 dark:text-white/50 text-xs mt-0.5">{order.customerName} • {order.customerPhone}</p>
                      {order.deliveryAddress && <p className="text-gray-400 dark:text-white/30 text-xs mt-0.5">📦 {order.deliveryAddress}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-bold text-hit-blue dark:text-hit-yellow">{Number(order.total).toLocaleString()} ₴</p>
                      <p className="text-gray-400 dark:text-white/30 text-[10px] mt-0.5">{new Date(order.createdAt).toLocaleDateString('uk-UA')}</p>
                    </div>
                  </div>
                  {order.items?.length > 0 && (
                    <div className="mb-3 space-y-0.5">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-gray-400 dark:text-white/40 text-xs">
                          {item.Product?.name} {item.size && `(${item.size})`} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200 dark:border-white/5">
                    <select value={order.status} onChange={(e) => handleStatusChange(order.id, 'status', e.target.value)}
                      className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white text-xs focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none">
                      <option value="new">нове</option>
                      <option value="processing">в обробці</option>
                      <option value="shipped">відправлено</option>
                      <option value="delivered">доставлено</option>
                      <option value="cancelled">скасовано</option>
                    </select>
                    <select value={order.paymentStatus} onChange={(e) => handleStatusChange(order.id, 'paymentStatus', e.target.value)}
                      className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white text-xs focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none">
                      <option value="pending">очікує</option>
                      <option value="paid">оплачено</option>
                      <option value="failed">відхилено</option>
                      <option value="refunded">повернено</option>
                    </select>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/5">
                    {order.ttnNumber ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 dark:text-white/40 text-xs">ТТН:</span>
                        <a
                          href={`https://novaposhta.ua/tracking/?cargo_number=${order.ttnNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-hit-blue dark:text-hit-yellow text-xs font-medium hover:underline"
                        >
                          {order.ttnNumber}
                        </a>
                      </div>
                    ) : order.deliveryCityRef && order.deliveryWarehouseRef ? (
                      <button
                        onClick={() => handleCreateTTN(order)}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        📦 Створити ТТН
                      </button>
                    ) : (
                      <p className="text-gray-300 dark:text-white/20 text-[10px]">НП дані відсутні</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'users' && canUsers && <UsersPanel users={users} onReload={loadUsers} />}
      {tab === 'logs' && canUsers && <AuditLogsPanel />}
      {tab === 'analytics' && canAnalytics && <AnalyticsPanel />}
    </div>
  );
}

function UsersPanel({ users, onReload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'warehouse' });
  const [loading, setLoading] = useState(false);
  const { admin } = useAuth();

  const inputClass = "w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-white/30 focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none transition-all";

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/users', form);
      toast.success('Користувача створено');
      setForm({ username: '', password: '', role: 'warehouse' });
      setShowAdd(false);
      onReload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Помилка');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Видалити користувача?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('Видалено');
      onReload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Помилка');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-gray-400 dark:text-white/40 text-xs">{users.length} користувачів</p>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-1.5 text-xs">
          <FiPlus size={13} /> додати
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-50 dark:bg-white/5 border border-hit-yellow/30 rounded-2xl p-5 mb-5">
          <p className="font-heading font-semibold text-gray-900 dark:text-white text-sm mb-4">новий користувач</p>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" placeholder="логін" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className={inputClass} />
            <input type="password" placeholder="пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className={inputClass} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
              <option value="admin">адмін</option>
              <option value="accountant">бухгалтер</option>
              <option value="warehouse">склад</option>
            </select>
            <div className="md:col-span-3 flex gap-2 mt-1">
              <button type="submit" disabled={loading} className="btn-primary text-xs disabled:opacity-50">{loading ? '...' : 'створити'}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-xs">скасувати</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center">
              <FiUsers size={16} className="text-gray-400 dark:text-white/40" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 dark:text-white text-sm font-medium">{user.username}</h3>
              <p className="text-gray-400 dark:text-white/40 text-xs">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  user.role === 'admin' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                  user.role === 'accountant' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                  'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                }`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </p>
            </div>
            {user.id !== admin?.id && (
              <button onClick={() => handleDelete(user.id)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-red-400 transition-colors">
                <FiTrash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const ACTION_LABELS = {
  login: 'вхід',
  create: 'створення',
  update: 'оновлення',
  delete: 'видалення',
};

const ENTITY_LABELS = {
  auth: 'авторизація',
  product: 'товар',
  order: 'замовлення',
  user: 'користувач',
};

const ACTION_COLORS = {
  login: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  create: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400',
  update: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  delete: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
};

function AuditLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadLogs = (entity) => {
    setLoading(true);
    const params = entity && entity !== 'all' ? `?entity=${entity}&limit=200` : '?limit=200';
    api.get(`/auth/logs${params}`)
      .then((r) => setLogs(r.data))
      .catch(() => toast.error('Помилка завантаження'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLogs(filter); }, [filter]);

  const filterClass = (val) => `px-3 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
    filter === val
      ? 'bg-hit-yellow text-[#0a0e1a]'
      : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
  }`;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {[['all', 'всі'], ['auth', 'вхід'], ['product', 'товари'], ['order', 'замовлення'], ['user', 'користувачі']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className={filterClass(val)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 dark:text-white/40 text-sm text-center py-10">завантаження...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-400 dark:text-white/40 text-sm text-center py-10">записів немає</p>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => (
            <div key={log.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60'}`}>
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <span className="text-gray-400 dark:text-white/30 text-[10px]">
                    {ENTITY_LABELS[log.entity] || log.entity}
                  </span>
                  <span className="text-gray-900 dark:text-white text-xs font-medium">{log.adminUsername || '—'}</span>
                </div>
                {log.details && (
                  <p className="text-gray-500 dark:text-white/50 text-xs truncate">{log.details}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-gray-400 dark:text-white/30 text-[10px]">
                  {new Date(log.createdAt).toLocaleDateString('uk-UA')}
                </p>
                <p className="text-gray-300 dark:text-white/20 text-[10px]">
                  {new Date(log.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }) {
  const parseSizes = (raw) => {
    if (!raw) return [];
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed.map(s => ({ size: s, qty: 0 }));
    return Object.entries(parsed).map(([size, qty]) => ({ size, qty }));
  };

  const [form, setForm] = useState({
    name: product?.name || '', description: product?.description || '',
    price: product?.price || '', categoryId: product?.categoryId || product?.category_id || '',
    featured: product?.featured || false,
  });
  const [sizeRows, setSizeRows] = useState(() => {
    const rows = parseSizes(product?.sizes);
    return rows.length > 0 ? rows : [];
  });
  const [newSize, setNewSize] = useState('');
  const [newQty, setNewQty] = useState(0);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputClass = "w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-white/30 focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none transition-all";

  const addSize = () => {
    const s = newSize.trim().toUpperCase();
    if (!s) return;
    if (sizeRows.some(r => r.size === s)) { toast.error('такий розмір вже є'); return; }
    setSizeRows([...sizeRows, { size: s, qty: parseInt(newQty) || 0 }]);
    setNewSize('');
    setNewQty(0);
  };

  const removeSize = (idx) => setSizeRows(sizeRows.filter((_, i) => i !== idx));

  const updateSizeQty = (idx, qty) => {
    const rows = [...sizeRows];
    rows[idx].qty = parseInt(qty) || 0;
    setSizeRows(rows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('price', form.price);
    formData.append('categoryId', form.categoryId);
    formData.append('featured', form.featured);

    if (sizeRows.length > 0) {
      const sizesObj = {};
      sizeRows.forEach(r => { sizesObj[r.size] = r.qty; });
      formData.append('sizes', JSON.stringify(sizesObj));
      formData.append('stock', Object.values(sizesObj).reduce((a, b) => a + b, 0));
    } else {
      formData.append('sizes', JSON.stringify({}));
      formData.append('stock', 0);
    }

    if (image) formData.append('image', image);
    try {
      if (product) { await api.put(`/products/${product.id}`, formData); toast.success('збережено ✓'); }
      else { await api.post('/products', formData); toast.success('додано ✓'); }
      onSaved();
    } catch (err) { toast.error(err.response?.data?.error || 'помилка'); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-gray-50 dark:bg-white/5 border border-hit-yellow/30 rounded-2xl p-5 mb-5">
      <p className="font-heading font-semibold text-gray-900 dark:text-white text-sm mb-4">
        {product ? 'редагувати' : 'новий товар'}
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2"><input type="text" placeholder="назва" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} /></div>
        <div className="md:col-span-2"><textarea placeholder="опис" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inputClass} resize-none`} /></div>
        <input type="number" placeholder="ціна" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className={inputClass} />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className={inputClass}>
          <option value="">категорія</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="md:col-span-2">
          <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-wider mb-2">розміри та кількість</p>
          {sizeRows.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {sizeRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-14 text-center text-xs font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 rounded-lg py-1.5">{row.size}</span>
                  <input type="number" min="0" value={row.qty} onChange={(e) => updateSizeQty(idx, e.target.value)}
                    className="w-20 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-gray-900 dark:text-white text-xs text-center focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none" />
                  <span className="text-gray-400 dark:text-white/30 text-[10px]">шт</span>
                  <button type="button" onClick={() => removeSize(idx)} className="text-red-400 hover:text-red-500 text-xs ml-1">✕</button>
                </div>
              ))}
              <p className="text-gray-400 dark:text-white/30 text-[10px] mt-1">
                загалом: {sizeRows.reduce((sum, r) => sum + r.qty, 0)} шт
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="text" placeholder="розмір (S, M, L, XL...)" value={newSize} onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }}
              className="w-40 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white text-xs placeholder-gray-400 dark:placeholder-white/30 focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none" />
            <input type="number" min="0" placeholder="кіл-ть" value={newQty} onChange={(e) => setNewQty(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }}
              className="w-20 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-gray-900 dark:text-white text-xs text-center placeholder-gray-400 dark:placeholder-white/30 focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none" />
            <button type="button" onClick={addSize} className="text-hit-blue dark:text-hit-yellow text-xs font-medium hover:underline">+ додати</button>
          </div>
        </div>

        <div><input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-hit-yellow file:text-[#0a0e1a] file:text-xs file:font-medium file:cursor-pointer" /></div>
        <label className="flex items-center gap-2 text-gray-500 dark:text-white/50 text-xs cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-3.5 h-3.5 rounded" /> популярний
        </label>
        <div className="md:col-span-2 flex gap-2 mt-1">
          <button type="submit" disabled={loading} className="btn-primary text-xs disabled:opacity-50">{loading ? '...' : product ? 'зберегти' : 'додати'}</button>
          <button type="button" onClick={onClose} className="btn-secondary text-xs">скасувати</button>
        </div>
      </form>
    </div>
  );
}
