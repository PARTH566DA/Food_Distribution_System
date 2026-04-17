import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';

const PillNav = ({
  items = [],
  activeHref = "",
  className = "",
  ease = "power3.out",
  pillColor = "#1a1a1a",
  pillTextColor = "#1a1a1a",
  hoveredPillTextColor = "#ffffff",
  hoverPillColor = "#FDDED9", 
}) => {
  const circleRefs = useRef([]);
  const tlRefs = useRef([]);
  const location = useLocation();

  const lightenHex = (hex, amount = 0.18) => {
    if (!hex) return hex;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  useEffect(() => {
    const initTimeout = setTimeout(() => {
      const hoverColor = (hoverPillColor && hoverPillColor.toString().trim()) ? hoverPillColor : lightenHex(pillColor, 0.18);
      circleRefs.current.forEach((circle, i) => {
        if (!circle || !circle.parentElement) return;
        const pill = circle.parentElement;
        const { width: w, height: h } = pill.getBoundingClientRect();

        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;

        gsap.set(circle, {
          width: D,
          height: D,
          bottom: -delta,
          left: "50%",
          xPercent: -50,
          scale: 0,
          transformOrigin: `${D - delta}px`,
          backgroundColor: hoverColor,
          borderRadius: D / 6,
        });

        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 5.3, xPercent: -50, duration: 0.45, ease }, 0);

        const label = pill.querySelector('.pill-label');
        if (label) tl.to(label, { y: `-${h + 30}px`, duration: 0.65, ease }, 0);

        const hoverLabel = pill.querySelector('.pill-label-hover');
        if (hoverLabel) {
          gsap.set(hoverLabel, { y: `${h + 30}px`, opacity: 0 });
          tl.to(hoverLabel, { y: 0, opacity: 1, duration: 0.65, ease }, 0);

        }

        tlRefs.current[i] = tl;
      });
    }, 100);

    return () => clearTimeout(initTimeout);
  }, [items, pillColor, ease, location?.pathname]);

  const isRouterLink = (href) => href && !href.startsWith('http') && !href.startsWith('#');

  return (
    <nav className={`flex items-center justify-center ${className}`}>
      <ul className="flex list-none gap-[32px] ">
        {items.map((item, i) => {
          const currentPath = location?.pathname || "";
          const isActive = activeHref ? activeHref === item.href : currentPath === item.href;
          const commonClasses = "relative overflow-hidden inline-flex items-center justify-center pt-[16px] pb-[16px] pl-[12px] pr-[12px] rounded-full font-medium text-sm uppercase tracking-wider no-underline transition-all";
          const labelColor = isActive ? hoveredPillTextColor : pillTextColor;

          const content = (
            <>
              <span
                ref={(el) => (circleRefs.current[i] = el)}
                className="absolute pointer-events-none rounded-full"
                style={isActive ? { backgroundColor: pillColor } : undefined}
              />

              <span className="pill-label relative z-10 transition-colors" style={{ color: labelColor }}>
                {item.label}
              </span>

              <span className="pill-label-hover absolute z-40 pointer-events-none" style={{ color: hoveredPillTextColor }}>
                {item.label}
              </span>

              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" style={{ backgroundColor: pillTextColor }} />
              )}
            </>
          );

          return (
            <li
              key={item.href}
              onMouseEnter={() => tlRefs.current[i]?.play()}
              onMouseLeave={() => tlRefs.current[i]?.reverse()}
            >
              {isRouterLink(item.href) ? (
                <Link to={item.href} className={commonClasses} style={isActive ? { backgroundColor: pillColor } : undefined}>{content}</Link>
              ) : (
                <a href={item.href} className={commonClasses} style={isActive ? { backgroundColor: pillColor } : undefined}>{content}</a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default PillNav;