"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  sort?: number;
}

interface NavigationContextType {
  navItems: NavigationItem[];
  isLoaded: boolean;
  refreshNavigation: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType>({
  navItems: [],
  isLoaded: false,
  refreshNavigation: async () => {},
});

export function NavigationProvider({
  children,
  initialNav = [],
}: {
  children: React.ReactNode;
  initialNav?: NavigationItem[];
}) {
  const [navItems, setNavItems] = useState<NavigationItem[]>(initialNav);
  const [isLoaded, setIsLoaded] = useState<boolean>(initialNav.length > 0);

  const refreshNavigation = async () => {
    try {
      const res = await fetch("/api/pages");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.header) && data.header.length > 0) {
          setNavItems(data.header);
          setIsLoaded(true);
        }
      }
    } catch {}
  };

  useEffect(() => {
    // If not provided from server, load from API, but never flash fake items
    if (!initialNav || initialNav.length === 0) {
      refreshNavigation();
    }
  }, [initialNav]);

  return (
    <NavigationContext.Provider value={{ navItems, isLoaded, refreshNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
