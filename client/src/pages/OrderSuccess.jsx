import { Link } from 'react-router-dom';

export default function OrderSuccess() {
  return (
    <div className="pt-24 max-w-md mx-auto px-4 py-20 text-center">
      <img src="/hit-logo.png" alt="ФК Хіт" className="w-20 h-24 object-contain mx-auto mb-5" />
      <h1 className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-3">done! 🎉</h1>
      <p className="text-gray-500 dark:text-white/50 text-sm mb-8">
        дякуємо за підтримку клубу — зв'яжемось з тобою найближчим часом
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/catalog" className="btn-primary">ще мерч</Link>
        <Link to="/" className="btn-secondary">home</Link>
      </div>
    </div>
  );
}
