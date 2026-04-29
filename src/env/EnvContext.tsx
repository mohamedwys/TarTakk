import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ENV_CONFIGS, DEFAULT_ENV, getEnvConfig } from './envConfig';
import { loadStoredEnv, saveStoredEnv } from './envStorage';
import type { EnvContextValue, EnvId } from './envTypes';

const EnvContext = createContext<EnvContextValue | null>(null);

export function EnvProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<EnvId>(DEFAULT_ENV);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadStoredEnv();
      if (!cancelled && stored) {
        setCurrent(stored);
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setEnv = async (id: EnvId) => {
    setCurrent(id);
    await saveStoredEnv(id);
  };

  const value = useMemo<EnvContextValue>(
    () => ({
      current,
      config: getEnvConfig(current),
      allEnvs: ENV_CONFIGS,
      setEnv,
      isLoading,
    }),
    [current, isLoading]
  );

  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>;
}

export function useEnv(): EnvContextValue {
  const ctx = useContext(EnvContext);
  if (!ctx) {
    throw new Error('useEnv must be used within an EnvProvider');
  }
  return ctx;
}
