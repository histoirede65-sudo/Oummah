import { useCallback, useEffect, useState } from 'react';

import { audioDependencies } from '../../audioDependencies';
import type { SurahCatalogItem, SurahFilter, SurahSort } from '../../domain/audio';
import { useReciter } from '../../../../context/ReciterProvider';

export function useSurahCatalogViewModel(reciterId?: string) {
  const { currentReciter } = useReciter();
  const selectedReciterId = reciterId ?? currentReciter?.id;
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SurahSort>('number');
  const [filter, setFilter] = useState<SurahFilter>('all');
  const [items, setItems] = useState<readonly SurahCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!selectedReciterId) {
      setItems([]);
      setLoading(false);
      return () => undefined;
    }

    let active = true;
    setLoading(true);

    void audioDependencies.surahs.list({ reciterId: selectedReciterId, search, sort, filter })
      .then((result) => { if (active) setItems(result); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [filter, search, selectedReciterId, sort]);

  useEffect(() => {
    return refresh();
  }, [refresh]);

  return { items, loading, search, setSearch, sort, setSort, filter, setFilter, refresh };
}
