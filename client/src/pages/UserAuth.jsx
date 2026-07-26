import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function UserAuth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.phone, form.password);
      }
      navigate('/account');
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка');
    }
    setLoading(false);
  };

  return (
    <div className="pt-24 pb-16 max-w-md mx-auto px-5">
      <div className="bg-white dark:bg-hit-blue/40 rounded-2xl p-8 border border-gray-100 dark:border-white/5 shadow-[0_18px_44px_rgba(8,29,69,.08)] dark:shadow-[0_18px_44px_rgba(8,29,69,.4)]">
        <div className="text-center mb-6">
          <img src="/hit-logo.png" alt="ФК ХІТ" className="w-12 h-12 object-contain mx-auto mb-3" />
          <h1 className="font-heading font-bold text-lg text-hit-ink dark:text-hit-cream">
            {mode === 'login' ? 'Вхід' : 'Реєстрація'}
          </h1>
          <p className="text-hit-muted dark:text-hit-cream/50 text-xs mt-1">
            {mode === 'login' ? 'Увійдіть щоб бачити статус замовлень' : 'Створіть акаунт для відстеження замовлень'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-hit-muted dark:text-hit-cream/60 mb-1.5">Ім'я</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-hit-navy/50 text-hit-ink dark:text-hit-cream text-sm focus:outline-none focus:border-hit-gold"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-hit-muted dark:text-hit-cream/60 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-hit-navy/50 text-hit-ink dark:text-hit-cream text-sm focus:outline-none focus:border-hit-gold"
              required
            />
          </div>
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-hit-muted dark:text-hit-cream/60 mb-1.5">Телефон</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-hit-navy/50 text-hit-ink dark:text-hit-cream text-sm focus:outline-none focus:border-hit-gold"
                placeholder="+380..."
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-hit-muted dark:text-hit-cream/60 mb-1.5">Пароль</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-hit-navy/50 text-hit-ink dark:text-hit-cream text-sm focus:outline-none focus:border-hit-gold"
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Зачекайте...' : mode === 'login' ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>

        <div className="mt-5 text-center">
          {mode === 'login' ? (
            <p className="text-hit-muted dark:text-hit-cream/50 text-xs">
              Немає акаунту?{' '}
              <button onClick={() => { setMode('register'); setError(''); }} className="text-hit-gold hover:underline font-medium">
                Зареєструватися
              </button>
            </p>
          ) : (
            <p className="text-hit-muted dark:text-hit-cream/50 text-xs">
              Вже є акаунт?{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="text-hit-gold hover:underline font-medium">
                Увійти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
