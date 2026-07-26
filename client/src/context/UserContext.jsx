import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      api.get('/user/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('userToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (name, email, phone, password) => {
    const res = await api.post('/user/register', { name, email, phone, password });
    localStorage.setItem('userToken', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const login = async (email, password) => {
    const res = await api.post('/user/login', { email, password });
    localStorage.setItem('userToken', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const token = localStorage.getItem('userToken');
    const res = await api.put('/user/me', data, { headers: { Authorization: `Bearer ${token}` } });
    setUser(res.data);
    return res.data;
  };

  return (
    <UserContext.Provider value={{ user, loading, register, login, logout, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
