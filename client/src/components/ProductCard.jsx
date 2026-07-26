import { Link } from 'react-router-dom';
import { getImageUrl } from '../api';

export default function ProductCard({ product }) {
  const rawSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
  const sizeKeys = Array.isArray(rawSizes) ? rawSizes : Object.keys(rawSizes || {});

  return (
    <Link to={`/product/${product.id}`} className="group block bg-white dark:bg-hit-blue/40 rounded-2xl overflow-hidden shadow-[0_18px_44px_rgba(8,29,69,.08)] dark:shadow-[0_18px_44px_rgba(8,29,69,.4)] hover:shadow-[0_24px_56px_rgba(8,29,69,.14)] dark:hover:shadow-[0_24px_56px_rgba(8,29,69,.5)] transition-all duration-300">
      <div className="aspect-square relative overflow-hidden bg-gray-50 dark:bg-hit-navy/50 flex items-center justify-center">
        {product.image ? (
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-10">
            <img src="/hit-logo.png" alt="ФК ХІТ" className="w-20 h-20 object-contain opacity-15 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500" />
          </div>
        )}
        {product.featured && (
          <span className="absolute top-3 right-3 bg-hit-gold text-hit-blue text-[10px] font-heading font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            top
          </span>
        )}
      </div>
      <div className="p-4 space-y-1.5">
        <h3 className="font-body font-medium text-hit-ink dark:text-hit-cream text-sm leading-snug line-clamp-2 group-hover:text-hit-blue-700 dark:group-hover:text-hit-gold transition-colors">
          {product.name}
        </h3>
        {product.Category && (
          <p className="text-hit-muted dark:text-hit-cream/40 text-xs">{product.Category.name}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="font-heading font-bold text-base text-hit-ink dark:text-hit-gold">
            {Number(product.price).toLocaleString('uk-UA')} ₴
          </span>
          {sizeKeys && sizeKeys.length > 0 && (
            <span className="text-hit-muted dark:text-hit-cream/30 text-[10px] uppercase tracking-wider font-medium">
              {sizeKeys.join(' · ')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
