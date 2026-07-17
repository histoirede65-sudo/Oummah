// @ts-ignore
import { handleGet, integerParameter, json } from "../_shared/http.ts";

// @ts-ignore
import { getQuranFoundationSdk } from "../_shared/quranFoundation.ts";

// @ts-ignore
import { serve } from "../_shared/runtime.ts";

serve(
  handleGet(async (request) => {
    const { searchParams } = new URL(request.url);

    const chapter = integerParameter(
      searchParams,
      "chapter",
      1,
      114,
      { required: true },
    )!;

    const sdk = getQuranFoundationSdk();

    const response =
      await sdk.content.v4.verses.byChapter(
        String(chapter),
        {
          words: true,
        },
      );

    return json(response);
  }),
);