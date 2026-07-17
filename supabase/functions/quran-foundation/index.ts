import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getQuranFoundationSdk } from "../_shared/quranFoundation.ts";

serve(async () => {
  try {
    const sdk = getQuranFoundationSdk();

    const result = await sdk.content.v4.chapters.list();

    return new Response(
      JSON.stringify(result, null, 2),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : null,
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});