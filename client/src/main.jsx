import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SiteSettingsProvider>
          <AuthProvider>
            <UserProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </UserProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
