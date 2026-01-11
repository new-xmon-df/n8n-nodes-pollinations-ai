# n8n-nodes-pollinations-ai

This is an n8n community node that lets you generate images using [Pollinations AI](https://pollinations.ai) in your n8n workflows.

[Pollinations](https://pollinations.ai) is an AI image generation platform that provides access to various models like Flux, Turbo, GPT Image, and more.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Quick Install

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-pollinations-ai` and confirm

## Operations

### Generate Image

Generate an image from a text prompt using Pollinations AI.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| Prompt | Yes | The text prompt to generate the image from |
| Model | Yes | The model to use (Flux, Turbo, GPT Image, etc.) |

**Advanced Options:**

| Option | Default | Description |
|--------|---------|-------------|
| Width | 1024 | Width of the generated image (64-2048) |
| Height | 1024 | Height of the generated image (64-2048) |
| Seed | 0 | Seed for reproducible generation (0 = random) |
| No Logo | false | Remove the Pollinations watermark |
| Enhance Prompt | false | Automatically enhance the prompt |
| Safe Mode | false | Enable content safety filter |

## Credentials

To use this node, you need a Pollinations API key:

1. Go to [enter.pollinations.ai](https://enter.pollinations.ai)
2. Create an account and generate an API key
3. In n8n, create a new **Pollinations API** credential
4. Paste your API key (either `pk_` or `sk_` type)

### Key Types

- **Publishable Keys (`pk_`)**: Client-side safe, IP rate-limited
- **Secret Keys (`sk_`)**: Server-side, no rate limits, can spend Pollen

## Available Models

| Model | Description |
|-------|-------------|
| Flux | High quality image generation (default) |
| Turbo | Faster generation with good quality |
| GPT Image | OpenAI DALL-E style generation |
| Kontext | Context-aware image generation |
| Seedream | Dream-like artistic images |
| Nanobanana | Lightweight fast model |
| Nanobanana Pro | Enhanced nanobanana model |

## Example Usage

### Basic Image Generation

1. Add a **Pollinations** node to your workflow
2. Select your Pollinations API credentials
3. Enter a prompt like "A beautiful sunset over mountains"
4. Select a model (e.g., Flux)
5. Execute the node

The output will be a binary image that you can:
- Save to disk using the **Write Binary File** node
- Upload to cloud storage (S3, Google Drive, etc.)
- Send via email or messaging platforms
- Process with other image manipulation nodes

## Compatibility

- n8n version: 1.0.0 or later
- Node.js version: 18.0.0 or later

## Resources

- [Pollinations API Documentation](https://enter.pollinations.ai/api/docs)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Report Issues](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/issues)

## License

[MIT](LICENSE)
