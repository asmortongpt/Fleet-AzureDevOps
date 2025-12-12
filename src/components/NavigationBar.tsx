
import { useState, useRef, useEffect } from 'react';

export function NavigationBar() {
  const [activeIndex, setActiveIndex] = useState(0);
  const navItemsRef = useRef([]);

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = (index + 1) % navItemsRef.current.length;
        navItemsRef.current[nextIndex]?.focus();
        setActiveIndex(nextIndex);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = (index - 1 + navItemsRef.current.length) % navItemsRef.current.length;
        navItemsRef.current[prevIndex]?.focus();
        setActiveIndex(prevIndex);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        navItemsRef.current[index]?.click();
        break;

      case 'Home':
        e.preventDefault();
        navItemsRef.current[0]?.focus();
        setActiveIndex(0);
        break;

      case 'End':
        e.preventDefault();
        const lastIndex = navItemsRef.current.length - 1;
        navItemsRef.current[lastIndex]?.focus();
        setActiveIndex(lastIndex);
        break;
    }
  };

  return (
    <nav role="navigation" aria-label="Main navigation">
      <ul role="menubar" className="flex gap-4">
        {menuItems.map((item, index) => (
          <li key={item.id} role="none">
            <button
              ref={el => navItemsRef.current[index] = el}
              role="menuitem"
              tabIndex={index === activeIndex ? 0 : -1}
              aria-current={index === activeIndex ? 'page' : undefined}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={() => navigate(item.path)}
              className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
