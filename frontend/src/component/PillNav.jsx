import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';

// To override the hover bubble color, paste your color here as `hoverPillColor` (e.g. '#FED0CB')
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

  // Lighten a hex color by a given amount (0-1)
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
    // Small timeout ensures the DOM has rendered before GSAP calculates sizes
    const initTimeout = setTimeout(() => {
      // prefer explicit hover color prop when provided, otherwise compute lighter shade
      const hoverColor = (hoverPillColor && hoverPillColor.toString().trim()) ? hoverPillColor : lightenHex(pillColor, 0.18);
      circleRefs.current.forEach((circle, i) => {
        if (!circle || !circle.parentElement) return;
        const pill = circle.parentElement;
        const { width: w, height: h } = pill.getBoundingClientRect();

        // Calculate the geometry for the rising bubble effect
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;

        // Set initial state of the hover circle (lighter than pillColor)
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

        // Create the hover timeline
        const tl = gsap.timeline({ paused: true });
        // slightly larger scale for more pronounced effect and a bit slower for smoothness
        tl.to(circle, { scale: 5.3, xPercent: -50, duration: 0.45, ease }, 0);

        // Slide the original label up/out (use slightly larger offset to account for taller pills)
        const label = pill.querySelector('.pill-label');
        if (label) tl.to(label, { y: `-${h + 30}px`, duration: 0.65, ease }, 0);

        // Slide the hover label (light) in from bottom
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
      <ul className="flex list-none gap-[32px] m-6 px-8 py-4 bg-white/20 rounded-full backdrop-blur-sm">
        {items.map((item, i) => {
          const currentPath = location?.pathname || "";
          const isActive = activeHref ? activeHref === item.href : currentPath === item.href;
          const commonClasses = "relative overflow-hidden inline-flex items-center justify-center pt-[16px] pb-[16px] pl-[12px] pr-[12px] rounded-full font-light font-alexandria text-dimgray text-sm uppercase tracking-wider no-underline transition-all";
          const labelColor = isActive ? hoveredPillTextColor : pillTextColor;

          const content = (
            <>
              {/* The animating bubble background */}
              <span
                ref={(el) => (circleRefs.current[i] = el)}
                className="absolute pointer-events-none rounded-full"
                style={isActive ? { backgroundColor: pillColor } : undefined}
              />

              {/* Static Label (Dark) */}
              <span className="pill-label relative z-10 transition-colors" style={{ color: labelColor }}>
                {item.label}
              </span>

              {/* Hover Label (Light) */}
              <span className="pill-label-hover absolute z-40 pointer-events-none" style={{ color: hoveredPillTextColor }}>
                {item.label}
              </span>

              {/* Active Indicator Dot */}
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