import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface RouterState {
  currentPath: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

export interface Router {
  state: RouterState;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  back: () => void;
  forward: () => void;
}

const RouterContext = createContext<Router | undefined>(undefined);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RouterState>(() => ({
    currentPath: typeof window !== "undefined" ? window.location.pathname : "/",
    params: {},
    query: parseQuery(typeof window !== "undefined" ? window.location.search : "")
  }));

  const updateState = useCallback(() => {
    setState({
      currentPath: typeof window !== "undefined" ? window.location.pathname : "/",
      params: {},
      query: parseQuery(typeof window !== "undefined" ? window.location.search : "")
    });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      updateState();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("popstate", handlePopState);
      }
    };
  }, [updateState]);

  const navigate = useCallback(
    (path: string, options: { replace?: boolean } = {}) => {
      if (options.replace) {
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", path);
        }
      } else {
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", path);
        }
      }
      updateState();
    },
    [updateState]
  );

  const back = useCallback(() => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  }, []);

  const forward = useCallback(() => {
    if (typeof window !== "undefined") {
      window.history.forward();
    }
  }, []);

  const router: Router = {
    state,
    navigate,
    back,
    forward
  };

  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
}

export function useRouter(): Router {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error("useRouter must be used within RouterProvider");
  }
  return router;
}

function parseQuery(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const query: Record<string, string> = {};
  params.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}
