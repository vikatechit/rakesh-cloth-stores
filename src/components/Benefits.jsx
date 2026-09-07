function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const items = [
  {
    title: 'PREMIUM QUALITY',
    desc: 'Sarees, pattu & lehengas',
    icon: (
      <Icon>
        <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
        <path d="M2 10h20" />
        <path d="M12 21 7.5 10 12 3l4.5 7L12 21z" />
      </Icon>
    ),
  },
  {
    title: 'WHATSAPP VIDEO',
    desc: 'After store confirmation',
    icon: (
      <Icon>
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </Icon>
    ),
  },
  {
    title: 'VIZAG DELIVERY',
    desc: 'Often within 1 day',
    icon: (
      <Icon>
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 4v4h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </Icon>
    ),
  },
  {
    title: 'SIMPLE PRICE RANGES',
    desc: 'No complicated filters',
    icon: (
      <Icon>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" />
      </Icon>
    ),
  },
  {
    title: 'SECURE PACKING',
    desc: 'Ready for courier',
    icon: (
      <Icon>
        <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
        <path d="M12 13V3" />
        <path d="m3 8 9 5 9-5" />
        <path d="M16 5.5 8 10" />
      </Icon>
    ),
  },
];

export default function Benefits() {
  return (
    <section className="benefits-strip">
      <div className="benefits-container">
        {items.map((item) => (
          <div className="benefit-item" key={item.title}>
            <div className="benefit-icon-badge">{item.icon}</div>
            <div className="benefit-text">
              <h4>{item.title}</h4>
              <span>{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
