# n8n-nodes-pollinations-ai

This is an n8n community node that lets you generate images and text using [Pollinations AI](https://pollinations.ai) in your n8n workflows.

[Pollinations](https://pollinations.ai) is an AI platform that provides access to various image and text generation models.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Quick Install

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-pollinations-ai` and confirm

## Nodes

This package includes two nodes:

| Node | Description |
|------|-------------|
| **Pollinations** | Main node for image and text generation |
| **Pollinations Chat Model** | Sub-node for AI Agent integration |

## Operations (Pollinations Node)

### Generate Image

Generate an image from a text prompt using Pollinations AI.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| Prompt | Yes | The text prompt to generate the image from |
| Model | Yes | The model to use (loaded dynamically from API) |

**Advanced Options:**

| Option | Default | Description |
|--------|---------|-------------|
| Width | 1024 | Width of the generated image (64-2048) |
| Height | 1024 | Height of the generated image (64-2048) |
| Seed | 0 | Seed for reproducible generation (0 = random) |
| No Logo | false | Remove the Pollinations watermark |
| Enhance Prompt | false | Automatically enhance the prompt |
| Safe Mode | false | Enable content safety filter |

### Generate with Reference

Generate an image using a reference image (image-to-image). Only models supporting image input are shown.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| Prompt | Yes | Text describing how to transform or use the reference image |
| Reference Image URL | Yes | URL of the reference image (must be publicly accessible) |
| Model | Yes | The model to use (only models with image input support) |

**Advanced Options:**

| Option | Default | Description |
|--------|---------|-------------|
| Width | 1024 | Width of the generated image (64-2048) |
| Height | 1024 | Height of the generated image (64-2048) |
| Seed | 0 | Seed for reproducible generation (0 = random) |
| No Logo | false | Remove the Pollinations watermark |
| Enhance Prompt | false | Automatically enhance the prompt |
| Safe Mode | false | Enable content safety filter |

**Supported Models:**

Models are filtered dynamically from the API. Common models supporting reference images include:
- FLUX.1 Kontext
- NanoBanana / NanoBanana Pro
- Seedream 4.0
- GPT Image

### Generate Text

Generate text from a prompt using AI language models.

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| Prompt | Yes | The text prompt or question for the AI model |
| Model | Yes | The AI model to use (loaded dynamically from API) |
| System Prompt | No | Instructions that define the AI behavior and context |
| Temperature | No | Controls creativity: 0.0 = strict, 2.0 = very creative (default: 0.7) |

**Advanced Options:**

| Option | Default | Description |
|--------|---------|-------------|
| JSON Response | false | Force the response in JSON format (not supported by all models) |
| Seed | -1 | Seed for reproducible results (-1 = random) |

## Pollinations Chat Model (Sub-node)

A sub-node designed for use with **AI Agents** and **LLM Chains** in n8n. This node provides a language model that can be connected to AI workflow nodes.

### Use Cases

- Connect to **AI Agent** nodes for conversational AI workflows
- Use with **LLM Chain** nodes for text processing pipelines
- Build custom AI assistants using n8n's AI capabilities

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| Model | Yes | The chat model to use (loaded dynamically from API) |
| Temperature | Yes | Controls randomness: 0 = deterministic, 2 = very creative (default: 1) |

### Advanced Options

| Option | Default | Description |
|--------|---------|-------------|
| Max Tokens | 0 | Maximum tokens in response (0 = model default) |
| Top P | 1 | Nucleus sampling parameter (0-1) |
| Frequency Penalty | 0 | Reduce repetition of token sequences (-2 to 2) |
| Presence Penalty | 0 | Increase likelihood of new topics (-2 to 2) |
| Timeout | 60000 | Request timeout in milliseconds |

### How to Use

1. Add an **AI Agent** or **LLM Chain** node to your workflow
2. Add a **Pollinations Chat Model** node
3. Connect the Chat Model output to the Agent/Chain model input
4. Configure your Pollinations API credentials
5. Select a model and adjust parameters as needed

## Credentials

To use this node, you need a Pollinations API key.

### Creating an API Key

1. Go to [enter.pollinations.ai](https://enter.pollinations.ai)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Configure your key:
   - **Name**: Give your key a descriptive name (e.g., "n8n Integration")
   - **Type**: Choose between Publishable (`pk_`) or Secret (`sk_`)
   - **Model Access**: Select which models this key can use (see below)
6. Copy the generated key

### Configuring Model Access

When creating an API key, you can restrict which models the key has access to. This is useful for:

- **Cost control**: Limit access to expensive models
- **Security**: Restrict capabilities of shared keys
- **Organization**: Create keys for specific use cases

The node automatically filters the model dropdown to show only the models your API key has permission to use. If you don't see a model you expect, check your key's model permissions at [enter.pollinations.ai](https://enter.pollinations.ai).

### Setting up in n8n

1. In n8n, go to **Credentials**
2. Click **Add Credential**
3. Search for **Pollinations API**
4. Paste your API key
5. Click **Save**

### API Key Types

| Type | Prefix | Use Case | Rate Limits |
|------|--------|----------|-------------|
| **Publishable** | `pk_` | Client-side apps, testing | IP-based rate limiting |
| **Secret** | `sk_` | Server-side, production | No rate limits, can spend Pollen |

> **Important**: Secret keys (`sk_`) should never be exposed in client-side code. Use them only in server environments like n8n.

## Available Models

Models are loaded dynamically from the Pollinations API, ensuring you always have access to the latest available models.

### Image Models

Common models include Flux, Turbo, GPT Image, Kontext, Seedream, and more.

### Text Models

Common models include OpenAI GPT-5, Claude, Gemini, DeepSeek, Mistral, and more.

## Example Usage

### Basic Image Generation

1. Add a **Pollinations** node to your workflow
2. Select **Generate Image** operation
3. Select your Pollinations API credentials
4. Enter a prompt like "A beautiful sunset over mountains"
5. Select a model (e.g., Flux)
6. Execute the node

The output will be a binary image that you can:
- Save to disk using the **Write Binary File** node
- Upload to cloud storage (S3, Google Drive, etc.)
- Send via email or messaging platforms
- Process with other image manipulation nodes

### Image-to-Image with Reference

1. Add a **Pollinations** node to your workflow
2. Select **Generate with Reference** operation
3. Select your Pollinations API credentials
4. Enter a prompt like "Transform into a watercolor painting"
5. Enter the URL of your reference image
6. Select a model (e.g., Kontext)
7. Execute the node

Use cases for reference images:
- **Style transfer**: Apply artistic styles to existing images
- **Consistent characters**: Generate variations of a character for tutorials
- **Image editing**: Modify specific aspects of an image with text prompts
- **Product variations**: Create different versions of product images

### Basic Text Generation

1. Add a **Pollinations** node to your workflow
2. Select **Generate Text** operation
3. Select your Pollinations API credentials
4. Enter a prompt like "Explain quantum computing in simple terms"
5. Optionally add a system prompt to define AI behavior
6. Select a model (e.g., OpenAI)
7. Execute the node

The output will be a JSON object with the generated text and metadata.

### AI Agent Integration

1. Add an **AI Agent** node to your workflow
2. Add a **Pollinations Chat Model** node
3. Connect the Chat Model to the Agent's model input
4. Configure your Pollinations API credentials on the Chat Model
5. Select a model (e.g., OpenAI, Claude, or DeepSeek)
6. Add tools to your Agent as needed
7. Execute the workflow

This setup allows you to build conversational AI assistants powered by Pollinations models.

## Compatibility

- n8n version: 1.0.0 or later
- Node.js version: 18.0.0 or later

## Resources

- [Pollinations API Documentation](https://enter.pollinations.ai/api/docs)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Report Issues](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/issues)

## License

[MIT](LICENSE)
