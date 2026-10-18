import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, text, from, apiKey } = await req.json();

    const telnyxApiKey = Deno.env.get("TELNYX_API_KEY") || apiKey;
    const telnyxFrom = from || Deno.env.get("TELNYX_PHONE_NUMBER");

    if (!telnyxApiKey || !telnyxFrom) {
      return new Response(
        JSON.stringify({ error: "TELNYX_API_KEY or TELNYX_PHONE_NUMBER is not configured." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${telnyxApiKey.trim()}`,
      },
      body: JSON.stringify({
        from: telnyxFrom.trim(),
        to,
        text,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
