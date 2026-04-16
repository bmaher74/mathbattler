const { onCall, HttpsError } = require("firebase-functions/v2/https");

// Gen 2 runs on Cloud Run. Without a public invoker, the browser's CORS preflight (OPTIONS)
// can be rejected before the callable responds — Chrome reports "No Access-Control-Allow-Origin".
// Auth is still enforced below via request.auth (anonymous Firebase users are fine).
exports.generateCombatQuestion = onCall(
  {
    secrets: ["DASH_SCOPE_API_KEY"],
    region: "us-central1",
    invoker: "public",
    cors: true
  },
  async (request) => {
    // 1. Security Check: In v2, auth is accessed via request.auth
    if (!request.auth) {
        throw new HttpsError(
            'unauthenticated', 
            'The Dungeon Master refuses to speak to unauthenticated mortals.'
        );
    }

    // 2. Load the secret API key
    const DASH_SCOPE_KEY = process.env.DASH_SCOPE_API_KEY; 

    const d = request.data || {};
    if (!d.messages || !Array.isArray(d.messages)) {
        throw new HttpsError("invalid-argument", "messages array required");
    }

    const body = {
        model: d.model || "qwen-flash",
        messages: d.messages
    };
    if (d.temperature !== undefined) body.temperature = d.temperature;
    if (d.max_tokens !== undefined) body.max_tokens = d.max_tokens;
    if (d.response_format !== undefined) body.response_format = d.response_format;

    // 3. Make the fetch call to Alibaba
    try {
        const response = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${DASH_SCOPE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("DashScope API Error:", errorText);
            if (response.status === 400) {
                throw new HttpsError(
                    "failed-precondition",
                    `DashScope 400: ${errorText.slice(0, 900)}`
                );
            }
            throw new Error(`API returned ${response.status}`);
        }

        const json = await response.json();
        return json;

    } catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }
        console.error("LLM Generation Failed:", error);
        throw new HttpsError(
            'internal', 
            'The dungeon master is sleeping.'
        );
    }
});