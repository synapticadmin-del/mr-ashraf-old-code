import {
  type EducationalMaterial,
  useGetEducationalMaterialsQuery,
} from '@/store/api/apiSlice';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

const DEFAULT_ARABIC_NAME = 'عربي';

type DefaultEducationalMaterialContextValue = {
  /** المادة الافتراضية (عربي إن وُجدت، وإلا أول مادة) */
  defaultMaterial: EducationalMaterial | null;
  defaultMaterialId: string | null;
  /** كل المواد من الـ API */
  materials: EducationalMaterial[];
  isLoading: boolean;
};

const DefaultEducationalMaterialContext =
  createContext<DefaultEducationalMaterialContextValue | null>(null);

export function DefaultEducationalMaterialProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data, isLoading } = useGetEducationalMaterialsQuery();
  const materials = data?.data ?? [];

  const defaultMaterial = useMemo(() => {
    if (!materials.length) return null;
    const arabic = materials.find((m) => m.nameAr === DEFAULT_ARABIC_NAME);
    return arabic ?? materials[0];
  }, [materials]);

  const defaultMaterialId = defaultMaterial?.id ?? null;

  const value = useMemo<DefaultEducationalMaterialContextValue>(
    () => ({
      defaultMaterial,
      defaultMaterialId,
      materials,
      isLoading,
    }),
    [defaultMaterial, defaultMaterialId, materials, isLoading]
  );

  return (
    <DefaultEducationalMaterialContext.Provider value={value}>
      {children}
    </DefaultEducationalMaterialContext.Provider>
  );
}

export function useDefaultEducationalMaterial(): DefaultEducationalMaterialContextValue {
  const ctx = useContext(DefaultEducationalMaterialContext);
  if (!ctx) {
    return {
      defaultMaterial: null,
      defaultMaterialId: null,
      materials: [],
      isLoading: false,
    };
  }
  return ctx;
}
