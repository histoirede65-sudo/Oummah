import { useCallback, useEffect, useMemo, useState } from "react";

import { useReciter } from "../../../../context/ReciterProvider";
import { audioDependencies } from "../../audioDependencies";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function useRecitersViewModel() {
  const { reciters, loading, currentReciter } = useReciter();

  const [search, setSearch] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<readonly string[]>([]);

  const refreshFavorites = useCallback(() => {
    void audioDependencies.reciterFavorites
      .list()
      .then(setFavoriteIds)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const filteredReciters = useMemo(() => {
    const query = normalize(search.trim());

    if (!query) {
      return reciters;
    }

    return reciters.filter((reciter) => {
      const arabicName =
        "arabicName" in reciter && typeof reciter.arabicName === "string"
          ? reciter.arabicName
          : "";

      return (
        normalize(reciter.name).includes(query) ||
        normalize(arabicName).includes(query) ||
        normalize(reciter.country).includes(query) ||
        normalize(reciter.style).includes(query)
      );
    });
  }, [reciters, search]);

  const continueListening = useMemo(() => {
    if (currentReciter) {
      return currentReciter;
    }

    return filteredReciters[0] ?? null;
  }, [currentReciter, filteredReciters]);

  const favoriteReciters = useMemo(() => {
    const ids = new Set(favoriteIds);
    return reciters.filter((reciter) => ids.has(reciter.id));
  }, [favoriteIds, reciters]);

  const toggleFavoriteReciter = useCallback(async (reciterId: string) => {
    const selected = await audioDependencies.reciterFavorites.toggle(reciterId);
    setFavoriteIds((ids) =>
      selected
        ? ids.includes(reciterId)
          ? ids
          : [...ids, reciterId]
        : ids.filter((id) => id !== reciterId),
    );
    return selected;
  }, []);

  const isFavoriteReciter = useCallback(
    (reciterId: string) => {
      return favoriteIds.includes(reciterId);
    },
    [favoriteIds],
  );

  const popularReciters = useMemo(() => {
    return [...filteredReciters]
      .sort((a, b) => b.availableSurahs - a.availableSurahs)
      .slice(0, 6);
  }, [filteredReciters]);

  return {
    loading,

    search,
    setSearch,

    reciters: filteredReciters,

    continueListening,

    favoriteReciters,
    favoriteIds,
    isFavoriteReciter,
    toggleFavoriteReciter,

    popularReciters,

    totalReciters: reciters.length,
  };
}
