import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';
import SocialLinks from './SocialLinks';

export default function Footer() {
  const { social } = useSiteSettings();

  return (
    <footer className="mt-auto bg-hit-blue/95 backdrop-blur-md border-t border-white/5 text-hit-cream/70">
      <div className="max-w-[1320px] mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/hit-logo.png" alt="ФК ХІТ" className="w-14 h-14 object-contain" />
              <span className="font-heading font-bold text-lg text-hit-cream">ФК «ХІТ»</span>
            </div>
            <p className="text-sm leading-relaxed">
              Футзальний клуб «ХІТ» (Київ). Чотириразовий чемпіон України, учасник Ліги чемпіонів УЄФА.
            </p>
          </div>

          <nav className="space-y-2">
            <p className="font-heading font-semibold text-xs uppercase tracking-widest text-hit-gold mb-3">Навігація</p>
            <Link to="/" className="block text-sm hover:text-hit-cream transition-colors">Головна</Link>
            <Link to="/catalog" className="block text-sm hover:text-hit-cream transition-colors">Каталог</Link>
            <Link to="/cart" className="block text-sm hover:text-hit-cream transition-colors">Кошик</Link>
          </nav>

          <div className="space-y-2">
            <p className="font-heading font-semibold text-xs uppercase tracking-widest text-hit-gold mb-3">Контакти</p>
            <p className="text-sm">Київ, вул. Митрополита Андрея Шептицького, 22-Б</p>
            <a href="tel:+380445176068" className="block text-sm hover:text-hit-cream transition-colors">+38 (044) 517 60 68</a>
            <a href="mailto:fc.hit.kyiv@ukr.net" className="block text-sm hover:text-hit-cream transition-colors">fc.hit.kyiv@ukr.net</a>
            <SocialLinks social={social} className="pt-3 gap-4" />
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-hit-cream/40 text-xs">
            &copy; {new Date().getFullYear()} ФК «ХІТ» (Київ) &middot; Усі права захищено
          </p>
        </div>
      </div>
    </footer>
  );
}
