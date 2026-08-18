-- OUMMAH — autorise les achats Wasil Google Play dans la RPC existante.
-- La définition existante est conservée ; seule la validation de p_platform est élargie.

do $$
declare
  function_definition text;
  updated_definition text;
begin
  select pg_get_functiondef(
    'public.grant_wasil_purchase_credits(uuid,text,text,text,text,text,text,timestamptz,jsonb)'::regprocedure
  )
  into function_definition;

  if function_definition is null then
    raise exception 'grant_wasil_purchase_credits function not found';
  end if;

  updated_definition := replace(
    function_definition,
    'p_platform not in (''revenuecat_test'', ''ios'', ''android'')',
    'p_platform not in (''revenuecat_test'', ''ios'', ''android'', ''google_play'')'
  );

  if updated_definition = function_definition then
    raise exception 'google_play validation target not found in grant_wasil_purchase_credits';
  end if;

  execute updated_definition;
end;
$$;
