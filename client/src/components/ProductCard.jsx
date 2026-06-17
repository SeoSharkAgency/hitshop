import { Link } from 'react-router-dom';
import { getImageUrl } from '../api';

export default function ProductCard({ product }) {
  const rawSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
  const sizeKeys = Array.isArray(rawSizes) ? rawSizes : Object.keys(rawSizes || {});

  return (
    <Link to={`/product/${product.id}`} className="card group">
      <div className="aspect-[4/5] relative overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-white/5">
        {product.image ? (
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-10">
            <img src="/hit-logo.png" alt="ФК Хіт" className="w-20 h-24 object-contain opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500" />
          </div>
        )}
        {product.featured && (
          <span className="absolute top-3 right-3 bg-hit-yellow text-[#0a0e1a] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            top
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-hit-blue dark:group-hover:text-hit-yellow transition-colors line-clamp-2 leading-snug">
          {product.name}
        </h3>
        {product.Category && (
          <p className="text-gray-400 dark:text-white/40 text-xs mt-1.5">{product.Category.name}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-hit-blue dark:text-hit-yellow font-heading font-bold text-base">
            {Number(product.price).toLocaleString()} ₴
          </span>
          {sizeKeys && sizeKeys.length > 0 && (
            <span className="text-gray-300 dark:text-white/30 text-[10px] uppercase tracking-wider">
              {sizeKeys.join(', ')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
