/** categoryId: the HadeethEnc category behind the theme. Without one, the theme searches the text. */
export type HadithTheme = { id: string; label: string; query: string; icon: string; color: string; categoryId?: string };

export const HADITH_THEMES: readonly HadithTheme[] = [
  { id: "foi", label: "Foi", query: "foi", icon: "heart-outline", color: "#B87992", categoryId: "3" },
  { id: "priere", label: "Prière", query: "prière", icon: "moon-outline", color: "#7F72B2", categoryId: "134" },
  { id: "comportement", label: "Comportement", query: "bon comportement", icon: "sparkles-outline", color: "#D09B57", categoryId: "266" },
  { id: "famille", label: "Famille", query: "famille", icon: "people-outline", color: "#B66C61", categoryId: "124" },
  { id: "parents", label: "Parents", query: "parents", icon: "home-outline", color: "#5E9B87", categoryId: "273" },
  { id: "patience", label: "Patience", query: "patience", icon: "hourglass-outline", color: "#6D8FA8" },
  { id: "repentir", label: "Repentir", query: "repentir", icon: "refresh-outline", color: "#7DA36E", categoryId: "321" },
  { id: "jeune", label: "Jeûne", query: "jeûne", icon: "sunny-outline", color: "#B98745", categoryId: "137" },
  { id: "science", label: "Science", query: "science", icon: "school-outline", color: "#7765A1", categoryId: "270" },
  { id: "commerce", label: "Commerce", query: "commerce", icon: "briefcase-outline", color: "#96755E", categoryId: "122" },
  { id: "epreuves", label: "Épreuves", query: "épreuve", icon: "shield-checkmark-outline", color: "#596F8C" },
  { id: "invocation", label: "Invocation", query: "invocation", icon: "hand-left-outline", color: "#A76C98", categoryId: "268" },
  { id: "maladie", label: "Maladie", query: "maladie", icon: "medkit-outline", color: "#518C86" },
  { id: "mort", label: "Mort & au-delà", query: "mort", icon: "leaf-outline", color: "#777A89", categoryId: "63" },
  { id: "pelerinage", label: "Pèlerinage", query: "pèlerinage", icon: "location-outline", color: "#9C7E42", categoryId: "138" },
] as const;


