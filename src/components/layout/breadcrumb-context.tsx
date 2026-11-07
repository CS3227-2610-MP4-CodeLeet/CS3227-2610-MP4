'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

type BreadcrumbContextType = {
  leafTitle: string | null;
  setLeafTitle: (title: string | null) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  leafTitle: null,
  setLeafTitle: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [leafTitle, setLeafTitle] = useState<string | null>(null);

  return (
    <BreadcrumbContext.Provider value={{ leafTitle, setLeafTitle }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbTitle() {
  return useContext(BreadcrumbContext).leafTitle;
}

export function BreadcrumbSetter({ title }: { title: string }) {
  const { setLeafTitle } = useContext(BreadcrumbContext);

  useEffect(() => {
    setLeafTitle(title);
    return () => setLeafTitle(null);
  }, [title, setLeafTitle]);

  return null;
}
