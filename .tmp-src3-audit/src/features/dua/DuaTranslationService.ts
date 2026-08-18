import type { DuaCategory } from "./DuaCatalog";

/**
 * Les traductions sont désormais fournies par le catalogue français vérifié.
 *
 * Cette fonction conserve son contrat pour ne modifier ni l'architecture ni
 * les écrans existants. Aucun service de traduction automatique n'est appelé :
 * une dou'a ne doit jamais être retraduite par Google ou MyMemory à l'exécution.
 */
export async function ensureDuaCategoryFrench(
  category: DuaCategory,
): Promise<DuaCategory> {
  return category;
}
