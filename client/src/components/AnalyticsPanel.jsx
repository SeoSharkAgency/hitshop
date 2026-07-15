import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { FiTrendingUp, FiShoppingBag, FiDollarSign, FiUsers, FiPackage, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';

const PERIODS = [
  { value: 'week', label: 'Тиждень' },
  { value: 'month', label: 'Місяць' },
  { value: '3months', label: '3 місяці' },
  { value: '6months', label: 'Півроку' },
  { value: 'year', label: 'Рік' },
  { value: 'custom', label: 'Свій' },
];

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function formatMoney(val) {
  return Number(val).toLocaleString('uk-UA') + ' ₴';
}

function formatPeriodLabel(period, groupBy) {
  if (groupBy === 'day') {
    const d = new Date(period);
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
  }
  if (groupBy === 'week') {
    return `тижд. ${period.split('-')[1]}`;
  }
  if (groupBy === 'month') {
    const [y, m] = period.split('-');
    const months = ['', 'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
    return `${months[parseInt(m)]} ${y.slice(2)}`;
  }
  return period;
}

export default function AnalyticsPanel() {
  const [period, setPeriod] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [chart, setChart] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topSizes, setTopSizes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview');

  const params = period === 'custom'
    ? `?period=custom&from=${customFrom}&to=${customTo}`
    : `?period=${period}`;

  const loadData = useCallback(() => {
    if (period === 'custom' && (!customFrom || !customTo)) return;
    setLoading(true);
    Promise.all([
      api.get(`/analytics/summary${params}`),
      api.get(`/analytics/chart${params}`),
      api.get(`/analytics/top-products${params}&limit=10`),
      api.get(`/analytics/top-sizes${params}`),
      api.get(`/analytics/categories${params}`),
    ]).then(([s, c, tp, ts, cat]) => {
      setSummary(s.data);
      setChart(c.data);
      setTopProducts(tp.data);
      setTopSizes(ts.data);
      setCategories(cat.data);
    }).catch(() => toast.error('Помилка завантаження аналітики'))
      .finally(() => setLoading(false));
  }, [period, customFrom, customTo]);

  useEffect(() => { loadData(); }, [loadData]);

  const exportCSV = () => {
    const lines = ['\ufeff'];

    lines.push('ЗВІТ HITSHOP');
    lines.push(`Період:,${period === 'custom' ? `${customFrom} — ${customTo}` : PERIODS.find(p => p.value === period)?.label || period}`);
    lines.push(`Дата звіту:,${new Date().toLocaleDateString('uk-UA')}`);
    lines.push('');

    if (summary) {
      lines.push('ПІДСУМКИ');
      lines.push(`Виручка:,${summary.revenue} ₴`);
      lines.push(`Замовлень:,${summary.totalOrders}`);
      lines.push(`Успішних:,${summary.successOrders}`);
      lines.push(`Скасованих:,${summary.cancelledOrders}`);
      lines.push(`Оплачених:,${summary.paidOrders}`);
      lines.push(`Продано одиниць:,${summary.itemsSold}`);
      lines.push(`Середній чек:,${summary.avgCheck} ₴`);
      lines.push('');
    }

    if (topProducts.length > 0) {
      lines.push('ТОП ТОВАРИ');
      lines.push('Товар,Категорія,Продано шт,Виручка,Замовлень');
      topProducts.forEach(p => {
        lines.push(`"${p.name}","${p.category || ''}",${p.totalQty},${p.totalRevenue},${p.orderCount}`);
      });
      lines.push('');
    }

    if (categories.length > 0) {
      lines.push('КАТЕГОРІЇ');
      lines.push('Категорія,Продано шт,Виручка');
      categories.forEach(c => {
        lines.push(`"${c.category}",${c.totalQty},${c.totalRevenue}`);
      });
      lines.push('');
    }

    if (topSizes.length > 0) {
      lines.push('РОЗМІРИ');
      lines.push('Розмір,Продано шт,Замовлень');
      topSizes.forEach(s => {
        lines.push(`"${s.size}",${s.totalQty},${s.orderCount}`);
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hitshop-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Звіт завантажено');
  };

  const pillClass = (active) => `px-3 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
    active
      ? 'bg-hit-yellow text-[#0a0e1a]'
      : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
  }`;

  const viewPill = (val, label) => (
    <button key={val} onClick={() => setView(val)} className={pillClass(view === val)}>{label}</button>
  );

  const StatCard = ({ icon: Icon, label, value, sub, color = 'text-hit-blue dark:text-hit-yellow' }) => (
    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
          <Icon size={15} className="text-gray-400 dark:text-white/40" />
        </div>
        <span className="text-gray-400 dark:text-white/40 text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`font-heading font-bold text-xl ${color}`}>{value}</p>
      {sub && <p className="text-gray-400 dark:text-white/30 text-[10px] mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)} className={pillClass(period === p.value)}>
            {p.label}
          </button>
        ))}
        <button onClick={exportCSV} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30 transition-all">
          <FiDownload size={12} /> CSV
        </button>
      </div>

      {period === 'custom' && (
        <div className="flex gap-2 mb-4 items-center">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white text-xs focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none" />
          <span className="text-gray-400 text-xs">—</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white text-xs focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none" />
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 dark:text-white/40 text-sm text-center py-16">завантаження...</p>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard icon={FiDollarSign} label="Виручка" value={formatMoney(summary.revenue)} sub={`${summary.successOrders} замовлень`} />
              <StatCard icon={FiShoppingBag} label="Замовлень" value={summary.totalOrders} sub={`${summary.cancelledOrders} скасовано`} />
              <StatCard icon={FiPackage} label="Продано" value={`${summary.itemsSold} шт`} sub="одиниць товару" />
              <StatCard icon={FiTrendingUp} label="Сер. чек" value={formatMoney(summary.avgCheck)} sub={`${summary.paidOrders} оплачено`} />
            </div>
          )}

          <div className="flex gap-1.5 mb-5 flex-wrap">
            {viewPill('overview', 'Графік продажів')}
            {viewPill('products', 'Топ товари')}
            {viewPill('categories', 'Категорії')}
            {viewPill('sizes', 'Розміри')}
          </div>

          {view === 'overview' && chart && (
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
              <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-wider mb-4">
                Продажі за період ({chart.data.length} {chart.groupBy === 'day' ? 'днів' : chart.groupBy === 'week' ? 'тижнів' : 'місяців'})
              </p>
              {chart.data.length === 0 ? (
                <p className="text-gray-400 dark:text-white/30 text-sm text-center py-10">Немає даних за цей період</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-400 dark:text-white/30 text-[10px] mb-2">Виручка (₴)</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="period" tickFormatter={(v) => formatPeriodLabel(v, chart.groupBy)} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                          labelStyle={{ color: '#94a3b8' }}
                          formatter={(val) => [formatMoney(val), 'Виручка']}
                          labelFormatter={(v) => formatPeriodLabel(v, chart.groupBy)}
                        />
                        <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-gray-400 dark:text-white/30 text-[10px] mb-2">Замовлення</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="period" tickFormatter={(v) => formatPeriodLabel(v, chart.groupBy)} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                          labelFormatter={(v) => formatPeriodLabel(v, chart.groupBy)}
                        />
                        <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Замовлення" />
                        <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} name="Скасовано" strokeDasharray="4 4" />
                        <Legend iconType="line" wrapperStyle={{ fontSize: 11 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'products' && (
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
              <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-wider mb-4">Топ-10 товарів</p>
              {topProducts.length === 0 ? (
                <p className="text-gray-400 dark:text-white/30 text-sm text-center py-10">Немає даних</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topProducts} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 10 }} width={100} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                        formatter={(val) => [formatMoney(val), 'Виручка']}
                      />
                      <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-1.5">
                    {topProducts.map((p, i) => (
                      <div key={p.productId} className="flex items-center gap-3 py-1.5">
                        <span className="w-5 text-center text-gray-400 dark:text-white/30 text-xs font-medium">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white text-xs font-medium truncate">{p.name}</p>
                          <p className="text-gray-400 dark:text-white/30 text-[10px]">{p.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-hit-blue dark:text-hit-yellow text-xs font-medium">{formatMoney(p.totalRevenue)}</p>
                          <p className="text-gray-400 dark:text-white/30 text-[10px]">{p.totalQty} шт • {p.orderCount} замовл.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {view === 'categories' && (
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
              <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-wider mb-4">Продажі за категоріями</p>
              {categories.length === 0 ? (
                <p className="text-gray-400 dark:text-white/30 text-sm text-center py-10">Немає даних</p>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={250} className="max-w-[300px]">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="totalRevenue"
                        nameKey="category"
                        cx="50%" cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categories.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                        formatter={(val) => [formatMoney(val), 'Виручка']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 w-full">
                    {categories.map((c, i) => (
                      <div key={c.category} className="flex items-center gap-3 py-1">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-gray-900 dark:text-white text-xs flex-1">{c.category}</span>
                        <span className="text-gray-500 dark:text-white/50 text-xs">{c.totalQty} шт</span>
                        <span className="text-hit-blue dark:text-hit-yellow text-xs font-medium">{formatMoney(c.totalRevenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'sizes' && (
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
              <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-wider mb-4">Популярність розмірів</p>
              {topSizes.length === 0 ? (
                <p className="text-gray-400 dark:text-white/30 text-sm text-center py-10">Немає даних</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topSizes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="size" tick={{ fill: '#d1d5db', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                        formatter={(val) => [val, 'Продано шт']}
                      />
                      <Bar dataKey="totalQty" fill="#10b981" radius={[6, 6, 0, 0]} name="Продано" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topSizes.map(s => (
                      <div key={s.size} className="bg-gray-100 dark:bg-white/10 rounded-lg px-3 py-1.5 text-center">
                        <p className="text-gray-900 dark:text-white text-xs font-medium">{s.size}</p>
                        <p className="text-gray-400 dark:text-white/30 text-[10px]">{s.totalQty} шт</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
