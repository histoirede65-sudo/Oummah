// @ts-ignore
import {
  handleGet,
  integerParameter,
  json,
  RequestError,
} from "../_shared/http.ts";

// @ts-ignore
import { getQuranFoundationSdk } from "../_shared/quranFoundation.ts";

// @ts-ignore
import { serve } from "../_shared/runtime.ts";

serve(
  handleGet(async (request) => {
    const sdk = getQuranFoundationSdk();

    const { searchParams } = new URL(request.url);

    const hasChapter = searchParams.has("chapter");
    const hasReciter = searchParams.has("reciter");

    // Liste des récitateurs
    if (!hasChapter && !hasReciter) {
      const reciters =
        await sdk.content.v4.resources.chapterReciters.list();

      return json(reciters);
    }

    if (!hasChapter || !hasReciter) {
      throw new RequestError(
        "chapter and reciter must be provided together",
      );
    }

    const chapter = integerParameter(
      searchParams,
      "chapter",
      1,
      114,
      { required: true },
    )!;

    const reciter = integerParameter(
      searchParams,
      "reciter",
      1,
      10000,
      { required: true },
    )!;

    // Récupération du fichier audio avec les segments
    const audio = await sdk.content.v4.audio.chapterRecitation.get(
      String(reciter),
      String(chapter),
      {
        segments: true,
      },
    );

    return json(audio);
  }),
);