export default function SocialLinks({ social, className = '', iconClassName = 'text-hit-cream/50 hover:text-hit-gold transition-colors', size = 20 }) {
  const links = [
    {
      key: 'instagram',
      href: social?.instagram,
      label: 'Instagram',
      icon: (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      key: 'telegram',
      href: social?.telegram,
      label: 'Telegram',
      icon: (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
          <path d="M21.8 4.3 2.9 11.6c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.6c.2.7 1.1.9 1.6.3l2.6-2.5 4.6 3.4c.6.5 1.6.1 1.8-.7l3.1-14.9c.2-1-.8-1.8-1.9-1.5zM9.6 15l-.3 3.6-1.4-4.6 9.9-6-8.2 7z" />
        </svg>
      ),
    },
    {
      key: 'facebook',
      href: social?.facebook,
      label: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
          <path d="M14.5 8.2h2.2V5.3h-2.2c-2.2 0-3.7 1.5-3.7 3.8V10.3H8.6v2.9h2.2V21h3v-7.8h2.3l.4-2.9h-2.7V9.2c0-.7.3-1 1.2-1z" />
        </svg>
      ),
    },
  ].filter((item) => item.href);

  if (links.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={iconClassName}
          aria-label={item.label}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
