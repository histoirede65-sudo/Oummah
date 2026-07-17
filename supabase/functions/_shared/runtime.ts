export type EdgeHandler = (request: Request) => Response | Promise<Response>;

interface EdgeRuntime {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: EdgeHandler): void;
}

declare const Deno: EdgeRuntime;

export function getSecret(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required Supabase secret: ${name}`);
  return value;
}

export function serve(handler: EdgeHandler): void {
  Deno.serve(handler);
}
