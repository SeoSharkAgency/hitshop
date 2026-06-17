import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success('вхід ✓');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'не вийшло');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-white/30 focus:border-hit-blue dark:focus:border-hit-yellow/50 focus:outline-none transition-all";

  return (
    <div className="pt-24 min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-7">
          <div className="text-center mb-7">
            <img src="/hit-logo.png" alt="ФК Хіт" className="w-14 h-16 object-contain mx-auto mb-3" />
            <h1 className="font-heading font-bold text-lg text-gray-900 dark:text-white">admin</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClass} placeholder="логін" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} placeholder="пароль" />
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-50">
              {loading ? '...' : 'увійти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
