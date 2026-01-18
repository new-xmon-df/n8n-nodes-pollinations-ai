# Implementation Plan: Fix HTTP 431 for Long Prompts

**Related Issue:** [issue-http-431-long-prompts.md](./issue-http-431-long-prompts.md)

## Overview

Change the `generateText` operation from `GET /text/{prompt}` to `POST /v1/chat/completions` to support prompts of any length.

## Files to Modify

- `nodes/Pollinations/Pollinations.node.ts` - Lines 512-600 (generateText operation)

## Current Implementation (Problematic)

```typescript
// Lines 527-560
// Build query parameters
const queryParams: Record<string, string> = {
  model,
  temperature: temperature.toString(),
};

if (systemPrompt) {
  queryParams.system = systemPrompt;
}
if (textOptions.seed !== undefined && textOptions.seed !== -1) {
  queryParams.seed = textOptions.seed.toString();
}
if (jsonMode) {
  queryParams.json = 'true';
}

// Build the URL - THIS IS THE PROBLEM
const baseUrl = 'https://gen.pollinations.ai/text';
const encodedPrompt = encodeURIComponent(prompt);
const queryString = new URLSearchParams(queryParams).toString();
const fullUrl = `${baseUrl}/${encodedPrompt}?${queryString}`;

// Record start time
const startTime = Date.now();

// Make the request with authentication
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: fullUrl,
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
  returnFullResponse: true,
});

// Calculate duration
const duration = Date.now() - startTime;

// Parse response text
const text = response.body as string;
```

## New Implementation

Replace lines 527-566 with:

```typescript
// Build messages array (OpenAI format)
const messages: Array<{ role: string; content: string }> = [];

if (systemPrompt) {
  messages.push({ role: 'system', content: systemPrompt });
}
messages.push({ role: 'user', content: prompt });

// Build request body
const requestBody: Record<string, unknown> = {
  model,
  messages,
  temperature,
};

if (textOptions.seed !== undefined && textOptions.seed !== -1) {
  requestBody.seed = textOptions.seed;
}
if (jsonMode) {
  requestBody.response_format = { type: 'json_object' };
}

// Record start time
const startTime = Date.now();

// Make POST request to OpenAI-compatible endpoint
const response = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://gen.pollinations.ai/v1/chat/completions',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: requestBody,
  json: true,
  returnFullResponse: true,
});

// Calculate duration
const duration = Date.now() - startTime;

// Parse OpenAI-format response
interface ChatCompletionResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const responseBody = response.body as ChatCompletionResponse;
const text = responseBody.choices[0]?.message?.content || '';
```

## Update Metadata Object

Replace the metadata construction (around line 579) with:

```typescript
// Build metadata for debugging
const metadata = {
  text: parsedJson || text,
  request: {
    model,
    system: systemPrompt || null,
    temperature,
    seed: textOptions.seed !== -1 ? textOptions.seed : null,
    jsonMode: jsonMode,
    promptLength: prompt.length,
  },
  response: {
    statusCode: response.statusCode,
    contentType: response.headers?.['content-type'] || 'application/json',
    duration: `${duration}ms`,
    usage: responseBody.usage || null,
  },
  timestamp: new Date().toISOString(),
};
```

## API Reference

### POST /v1/chat/completions

OpenAI-compatible endpoint that accepts:

**Request Body:**
```json
{
  "model": "openai",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.7,
  "seed": 42,
  "response_format": { "type": "json_object" }
}
```

**Response:**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "openai",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Generated text here..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

## Testing Checklist

- [ ] Build succeeds: `npm run build`
- [ ] Short prompt (< 1KB) works correctly
- [ ] Long prompt (8KB+) works correctly (previously failed with 431)
- [ ] System prompt is properly included
- [ ] Temperature parameter works
- [ ] Seed parameter works
- [ ] JSON mode (`response_format`) works
- [ ] Token usage is returned in metadata
- [ ] Error handling works for API errors

## Breaking Changes

**None.** The input parameters remain identical. The only changes are:

1. Internal API endpoint used
2. Response metadata now includes `usage` (token counts) - additive, not breaking
3. Request metadata now includes `promptLength` - additive, not breaking

## Rollback Plan

If issues arise, revert the changes to `Pollinations.node.ts` and advise users to keep prompts under 6000 characters until a proper fix is deployed.
