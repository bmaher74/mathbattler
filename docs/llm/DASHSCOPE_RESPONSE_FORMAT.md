# DashScope response formats (Math Battler)

## OpenAI-compatible Chat Completions (`/compatible-mode/v1/chat/completions`)

This app uses the **Singapore**-style base URL (`dashscope-intl.aliyuncs.com/compatible-mode/v1`) and `POST .../chat/completions`.

### Supported today

| `response_format` | Notes |
|-------------------|--------|
| `{ "type": "json_object" }` | **Supported.** The messages must mention JSON (case-insensitive) or the API may reject the request. This is what we send for structured game payloads. |
| `{ "type": "text" }` | Default text mode (not used for game JSON). |

### Not relied upon in compatible mode

| Feature | Notes |
|---------|--------|
| `{ "type": "json_schema", "json_schema": { ... } }` | **Native DashScope HTTP/SDK** can enforce `json_schema` on some models; **OpenAI-compatible** chat completions are documented primarily for `json_object`. Do not assume `json_schema` works on compatible-mode until confirmed per-model in Alibaba Model Studio docs. |

### Practical implication

- **Client-side**: Use **Zod** (or equivalent) to validate every parsed JSON object; use **bounded retries** with explicit validation error text when the model drifts.
- **Server prompt**: Keep schema field lists and types aligned with the Zod definitions (single source of truth in `js/ai/schemas/`).

Last reviewed: 2026-04-10 (per Alibaba Cloud Model Studio “structured output” and OpenAI compatibility docs).
