import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/hit-logo.png" alt="ФК Хіт" className="w-10 h-12 object-contain" />
            <div>
              <p className="font-heading font-bold text-gray-900 dark:text-white text-sm">hit<span className="text-hit-blue dark:text-hit-yellow">shop</span></p>
              <p className="text-gray-400 dark:text-white/40 text-xs mt-0.5">мерч фк хіт київ</p>
            </div>
          </div>
          <div className="flex gap-5">
            <a href="#" className="text-gray-400 hover:text-hit-blue dark:hover:text-hit-yellow transition-colors text-xs">instagram</a>
            <a href="#" className="text-gray-400 hover:text-hit-blue dark:hover:text-hit-yellow transition-colors text-xs">telegram</a>
            <a href="#" className="text-gray-400 hover:text-hit-blue dark:hover:text-hit-yellow transition-colors text-xs">facebook</a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 text-center">
          <p className="text-gray-400 dark:text-white/30 text-xs">
            &copy; {new Date().getFullYear()} фк "хіт" київ • 💛💙
          </p>
        </div>
      </div>
    </footer>
  );
}
