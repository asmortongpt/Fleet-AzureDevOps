// CRITICAL: React.Children polyfill for React 18 with older libraries
// This MUST load BEFORE any React code executes
(function() {
  // Create a temporary global to hold React when it loads
  const originalDefine = window.define;
  window.define = function(deps, factory) {
    if (typeof deps === 'function') {
      factory = deps;
      deps = [];
    }
    const module = factory ? factory() : undefined;
    if (module && module.createElement && !module.Children) {
      // This is React - add Children if missing
      console.log('[React Polyfill] Adding React.Children polyfill');
      module.Children = {
        map: function(children, fn) {
          if (!children) return [];
          return Array.isArray(children) ? children.map(fn) : [fn(children, 0)];
        },
        forEach: function(children, fn) {
          if (!children) return;
          if (Array.isArray(children)) {
            children.forEach(fn);
          } else {
            fn(children, 0);
          }
        },
        count: function(children) {
          if (!children) return 0;
          return Array.isArray(children) ? children.length : 1;
        },
        only: function(children) {
          if (!children || (Array.isArray(children) && children.length !== 1)) {
            throw new Error('React.Children.only expected to receive a single React element child.');
          }
          return Array.isArray(children) ? children[0] : children;
        },
        toArray: function(children) {
          if (!children) return [];
          return Array.isArray(children) ? children : [children];
        }
      };
    }
    if (originalDefine) {
      return originalDefine(deps, factory);
    }
    return module;
  };
})();
