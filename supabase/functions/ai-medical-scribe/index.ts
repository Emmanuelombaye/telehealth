import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, prefer",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transcript } = await req.json()

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'No transcript provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
      // FALLBACK: HEURISTIC CLINICAL ENGINE (Mini-LLM Simulation)
      // This allows the system to work "Intelligently" even without a paid key
      console.log("No API Key found. Using Local Clinical Heuristic Engine.")
      
      const subjective = transcript;
      let objective = "Vitals stable as reported. General appearance normal.";
      let assessment = "General clinical consultation.";
      let plan = "1. Follow up as needed.\n2. Patient advised on treatment protocol.";

      // Smart Parsing Heuristics
      const lower = transcript.toLowerCase();
      if (lower.includes("pain") || lower.includes("hurt") || lower.includes("sore")) {
        assessment = "Assessment of localized discomfort and reported pain symptoms.";
        plan = "1. Pain management protocol discussed.\n2. Diagnostic follow-up if symptoms persist.";
      }
      if (lower.includes("weight") || lower.includes("fat") || lower.includes("ozempic") || lower.includes("glp")) {
        assessment = "Metabolic optimization and weight management consultation.";
        plan = "1. Begin GLP-1 titration schedule.\n2. Nutritional counseling provided.\n3. Monthly metabolic panel follow-up.";
      }
      if (lower.includes("tired") || lower.includes("sleep") || lower.includes("energy")) {
        assessment = "Evaluation of reported fatigue and energy levels.";
        plan = "1. Labs ordered (Vitamin D, B12, Thyroid).\n2. Sleep hygiene protocol initiated.";
      }
      if (lower.includes("pressure") || lower.includes("heart") || lower.includes("pulse")) {
        objective = "Blood pressure and cardiac metrics discussed. Patient to monitor at home.";
        assessment = "Cardiovascular wellness assessment.";
      }

      return new Response(
        JSON.stringify({
          subjective,
          objective,
          assessment,
          plan,
          is_fallback: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // REAL LLM CALL (When API Key is added)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a world-class Medical Scribe. Convert the following transcript into a professional SOAP note in JSON format.
            Keys: subjective, objective, assessment, plan.
            Ensure the tone is clinical, concise, and authoritative.`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        response_format: { type: "json_object" }
      }),
    })

    const data = await response.json()
    const soap = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify(soap),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
