import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { audioDependencies } from "../features/audio/audioDependencies";
import type { CatalogReciter } from "../features/audio/domain/audio";
import { getReciterImage } from "../features/audio/data/QuranFoundationReciterMapper";
import { storageService } from "../core/storage";

const RECITER_BOOTSTRAP_CACHE_KEY = "oummah:audio:reciters:bootstrap:v2";

function normalizeReciterName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function canonicalReciterKey(value: string) {
  const normalized = normalizeReciterName(value);
  if (normalized.includes("mishary") || normalized.includes("afasy") || normalized.includes("alafasi")) return "misharyalafasy";
  if (normalized.includes("khalifahaltunaiji") || normalized.includes("khalifaaltunaiji") || normalized.includes("tunaiji")) return "khalifahaltunaiji";
  if (normalized.includes("abdullahhamadabusharida") || normalized.includes("abdullahhammadabusharida") || normalized.includes("abusharida") || normalized.includes("abushareeda") || normalized.includes("abushuraida")) return "abdullahhamadabusharida";
  return normalized;
}

function normalizeDisplayedReciter(reciter: CatalogReciter) {
  if (reciter.id === "12") {
    return {
      ...reciter,
      name: "Ali Al-Hudhaify",
    };
  }

  return reciter;
}

function orderReciters(reciters: readonly CatalogReciter[]) {
  return [...reciters].sort((left, right) => {
    const leftIsAliJabir = left.id === "158";
    const rightIsAliJabir = right.id === "158";
    if (leftIsAliJabir !== rightIsAliJabir) return leftIsAliJabir ? 1 : -1;
    return 0;
  });
}

function stabilizeReciters(reciters: readonly CatalogReciter[]) {
  const seen = new Set<string>();
  return orderReciters(reciters
    .map(normalizeDisplayedReciter)
    .filter((reciter) => {
      const key = canonicalReciterKey(reciter.name || reciter.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((reciter) => ({
      ...reciter,
      image: getReciterImage(Number(reciter.id), reciter.name),
    })));
}

type ReciterContextValue = {
  currentReciter: CatalogReciter | null;
  reciters: readonly CatalogReciter[];
  loading: boolean;
  setCurrentReciter(reciter: CatalogReciter): Promise<void>;
};

const ReciterContext =
  createContext<ReciterContextValue | null>(null);

export function ReciterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [reciters, setReciters] = useState<
    readonly CatalogReciter[]
  >([]);

  const [currentReciter, setCurrentReciterState] =
    useState<CatalogReciter | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const preferredId =
          await audioDependencies.preferredReciter.getDefaultId();
        const cachedReciters =
          await storageService.get<readonly CatalogReciter[]>(
            RECITER_BOOTSTRAP_CACHE_KEY,
          );

        if (active && cachedReciters?.length) {
          const stableCachedReciters = stabilizeReciters(cachedReciters);
          setReciters(stableCachedReciters);
          setCurrentReciterState(
            stableCachedReciters.find(
              (reciter) => reciter.id === preferredId,
            ) ??
              stableCachedReciters[0] ??
              null,
          );
          setLoading(false);
        }

        const availableReciters =
          await audioDependencies.reciters.list() as readonly CatalogReciter[];
        const stableReciters = stabilizeReciters(availableReciters);

        if (!active) return;

        setReciters(stableReciters);
        void storageService
          .set(RECITER_BOOTSTRAP_CACHE_KEY, stableReciters)
          .catch(() => undefined);

        const selected =
          stableReciters.find(
            (reciter) => reciter.id === preferredId,
          ) ??
          stableReciters[0] ??
          null;

        setCurrentReciterState(selected);
      } catch {
        if (active) {
          setCurrentReciterState((current) => current);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const setCurrentReciter = useCallback(
    async (reciter: CatalogReciter) => {
      setCurrentReciterState(reciter);

      await audioDependencies.preferredReciter.setDefault(
        reciter.id,
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      currentReciter,
      reciters,
      loading,
      setCurrentReciter,
    }),
    [
      currentReciter,
      reciters,
      loading,
      setCurrentReciter,
    ],
  );

  if (loading || !currentReciter) {
    return null;
  }

  return (
    <ReciterContext.Provider value={value}>
      {children}
    </ReciterContext.Provider>
  );
}

export function useReciter() {
  const context = useContext(ReciterContext);

  if (!context) {
    throw new Error(
      "useReciter must be used within ReciterProvider.",
    );
  }

  return context;
}
