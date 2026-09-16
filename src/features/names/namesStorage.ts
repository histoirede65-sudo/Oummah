import { storageService } from "../../core/storage";
const KEY = "@oummah/names/favorites/v1";
export const loadNameFavorites = () => storageService.get<string[]>(KEY).then((value) => value ?? []).catch(() => []);
export const saveNameFavorites = (ids: string[]) => storageService.set(KEY, ids).catch(() => undefined);
