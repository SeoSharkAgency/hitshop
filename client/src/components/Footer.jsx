import { Link } from 'react-router-dom';

export default function Footer() {
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
            <div className="flex gap-4 pt-3">
              <a href="https://www.instagram.com/fc.xit.kyiv" className="text-hit-cream/50 hover:text-hit-gold transition-colors" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"></circle></svg>
              </a>
              <a href="https://t.me/fchitkyivchannel" className="text-hit-cream/50 hover:text-hit-gold transition-colors" aria-label="Telegram">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21.8 4.3 2.9 11.6c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.6c.2.7 1.1.9 1.6.3l2.6-2.5 4.6 3.4c.6.5 1.6.1 1.8-.7l3.1-14.9c.2-1-.8-1.8-1.9-1.5zM9.6 15l-.3 3.6-1.4-4.6 9.9-6-8.2 7z"></path></svg>
              </a>
              <a href="https://www.facebook.com/share/g/1HvKB9AP2R/" className="text-hit-cream/50 hover:text-hit-gold transition-colors" aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14.5 8.2h2.2V5.3h-2.2c-2.2 0-3.7 1.5-3.7 3.8V10.3H8.6v2.9h2.2V21h3v-7.8h2.3l.4-2.9h-2.7V9.2c0-.7.3-1 1.2-1z"></path></svg>
              </a>
            </div>
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
