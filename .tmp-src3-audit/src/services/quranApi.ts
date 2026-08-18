const BASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL +
  "/functions/v1";

const ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

async function request<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export const QuranApi = {
  getSurahs() {
    return request<any[]>("/quran-foundation");
  },
};