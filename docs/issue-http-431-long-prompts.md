# Issue: HTTP 431 Error with Long Prompts

**Status:** Open
**Priority:** High
**Affects:** `generateText` operation
**Discovered:** 2026-01-18

## Problem Description

The `generateText` operation fails with HTTP 431 (Request Header Fields Too Large) when using prompts longer than approximately 8KB.

### Error Message

```json
{
  "errorMessage": "Request failed with status code 431",
  "errorDetails": {},
  "n8nDetails": {
    "stackTrace": [
      "AxiosError: Request failed with status code 431",
      "at settle (/usr/local/lib/node_modules/n8n/node_modules/.pnpm/axios@1.12.0/node_modules/axios/lib/core/settle.js:19:12)",
      "..."
    ]
  }
}
```

### Root Cause

The current implementation puts the **entire prompt in the URL path**:

```typescript
// Pollinations.node.ts - Line 547
const baseUrl = 'https://gen.pollinations.ai/text';
const encodedPrompt = encodeURIComponent(prompt);
const queryString = new URLSearchParams(queryParams).toString();
const fullUrl = `${baseUrl}/${encodedPrompt}?${queryString}`;
```

When the prompt is URL-encoded, special characters expand (spaces become `%20`, etc.), making the URL even larger.

Web servers (nginx, Cloudflare, etc.) have URL/header size limits, typically 8-16KB. When the prompt exceeds this limit, the server returns HTTP 431.

### Reproduction Steps

1. Use the Pollinations node with `generateText` operation
2. Input a prompt longer than ~8000 characters
3. Execute the node
4. Observe HTTP 431 error

### Example Prompt That Fails

Any prompt containing substantial text, such as:
- Full article content for analysis
- Long documents for summarization
- Detailed instructions with examples

## Proposed Solution

Change the `generateText` operation to use Pollinations' **OpenAI-compatible endpoint** (`POST /v1/chat/completions`) which accepts the prompt in the request body.

### Why This Works

- `POST /v1/chat/completions` sends data in the HTTP body, not the URL
- HTTP body has no practical size limit (typically several MB)
- This endpoint is already used by `PollinationsChatModel.node.ts` (line 238)
- No breaking changes for users - input parameters remain the same

### Implementation Plan

See [fix-http-431-implementation.md](./fix-http-431-implementation.md) for detailed implementation steps.

## Workarounds

Until this is fixed, users can:

1. **Use shorter prompts** - Keep prompts under ~6000 characters
2. **Use PollinationsChatModel** - The LangChain-compatible sub-node uses the correct endpoint
3. **Use HTTP Request node** - Call `POST /v1/chat/completions` directly with proper body

### HTTP Request Node Workaround

```json
{
  "method": "POST",
  "url": "https://gen.pollinations.ai/v1/chat/completions",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  "body": {
    "model": "openai",
    "messages": [
      { "role": "system", "content": "Your system prompt here" },
      { "role": "user", "content": "Your long prompt here (any length)" }
    ],
    "temperature": 0.7
  }
}
```

## Related Information

- HTTP 431 Status Code: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/431)
- Pollinations API: [Official Documentation](https://enter.pollinations.ai/api/docs)
- OpenAI Chat Completions format: [OpenAI API Reference](https://platform.openai.com/docs/api-reference/chat)
