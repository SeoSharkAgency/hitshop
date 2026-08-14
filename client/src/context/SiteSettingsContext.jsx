import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const DEFAULT_SOCIAL = {
  instagram: 'https://www.instagram.com/fc.xit.kyiv',
  telegram: 'https://t.me/fchitkyivchannel',
  facebook: 'https://www.facebook.com/share/g/1HvKB9AP2R/',
};

const SiteSettingsContext = createContext({
  social: DEFAULT_SOCIAL,
  reloadSocial: async () => {},
});

export function SiteSettingsProvider({ children }) {
  const [social, setSocial] = useState(DEFAULT_SOCIAL);

  const reloadSocial = async () => {
    try {
      const res = await api.get('/settings/social');
      setSocial({ ...DEFAULT_SOCIAL, ...res.data });
    } catch {
      setSocial(DEFAULT_SOCIAL);
    }
  };

  useEffect(() => {
    reloadSocial();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ social, reloadSocial }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
