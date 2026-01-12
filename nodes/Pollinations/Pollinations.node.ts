import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class Pollinations implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pollinations',
		name: 'pollinations',
		icon: 'file:pollinations.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Generate images and text using Pollinations AI',
		defaults: {
			name: 'Pollinations',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'pollinationsApi',
				required: true,
			},
		],
		properties: [
			// Operation
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Generate Image',
						value: 'generateImage',
						description: 'Generate an image from a text prompt',
						action: 'Generate an image from a text prompt',
					},
					{
						name: 'Generate Text',
						value: 'generateText',
						description: 'Generate text from a prompt using AI',
						action: 'Generate text from a prompt',
					},
				],
				default: 'generateImage',
			},

			// ==================== GENERATE IMAGE ====================

			// Prompt (Image)
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['generateImage'],
					},
				},
				description: 'The text prompt to generate the image from',
				typeOptions: {
					rows: 4,
				},
			},

			// Model (Image) - Dynamic loading
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				default: 'flux',
				displayOptions: {
					show: {
						operation: ['generateImage'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getImageModels',
				},
				description: 'The model to use for image generation',
			},

			// Advanced Options (Image)
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['generateImage'],
					},
				},
				options: [
					{
						displayName: 'Width',
						name: 'width',
						type: 'number',
						default: 1024,
						description: 'Width of the generated image in pixels',
						typeOptions: {
							minValue: 64,
							maxValue: 2048,
						},
					},
					{
						displayName: 'Height',
						name: 'height',
						type: 'number',
						default: 1024,
						description: 'Height of the generated image in pixels',
						typeOptions: {
							minValue: 64,
							maxValue: 2048,
						},
					},
					{
						displayName: 'Seed',
						name: 'seed',
						type: 'number',
						default: 0,
						description: 'Seed for reproducible generation. Use 0 for random.',
					},
					{
						displayName: 'No Logo',
						name: 'nologo',
						type: 'boolean',
						default: false,
						description: 'Whether to remove the Pollinations watermark',
					},
					{
						displayName: 'Enhance Prompt',
						name: 'enhance',
						type: 'boolean',
						default: false,
						description: 'Whether to automatically enhance the prompt for better results',
					},
					{
						displayName: 'Safe Mode',
						name: 'safe',
						type: 'boolean',
						default: false,
						description: 'Whether to enable content safety filter',
					},
				],
			},

			// ==================== GENERATE TEXT ====================

			// Prompt (Text)
			{
				displayName: 'Prompt',
				name: 'textPrompt',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['generateText'],
					},
				},
				description: 'The text prompt or question for the AI model',
				typeOptions: {
					rows: 4,
				},
			},

			// Model (Text) - Dynamic loading
			{
				displayName: 'Model',
				name: 'textModel',
				type: 'options',
				default: 'openai',
				displayOptions: {
					show: {
						operation: ['generateText'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getTextModels',
				},
				description: 'The AI model to use for text generation',
			},

			// System Prompt (Text)
			{
				displayName: 'System Prompt',
				name: 'systemPrompt',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateText'],
					},
				},
				description: 'Instructions that define the AI behavior and context',
				placeholder: 'You are a helpful assistant that responds concisely...',
				typeOptions: {
					rows: 3,
				},
			},

			// Temperature (Text)
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0.7,
				displayOptions: {
					show: {
						operation: ['generateText'],
					},
				},
				description: 'Controls creativity: 0.0 = strict/deterministic, 2.0 = very creative',
				typeOptions: {
					minValue: 0,
					maxValue: 2,
					numberPrecision: 1,
				},
			},

			// Advanced Options (Text)
			{
				displayName: 'Options',
				name: 'textOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['generateText'],
					},
				},
				options: [
					{
						displayName: 'JSON Response',
						name: 'jsonMode',
						type: 'boolean',
						default: false,
						description:
							'Whether to force the response in JSON format. Not supported by all models.',
					},
					{
						displayName: 'Seed',
						name: 'seed',
						type: 'number',
						default: -1,
						description: 'Seed for reproducible results. Use -1 for random.',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getImageModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('pollinationsApi');
					const apiKey = credentials.apiKey as string;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://gen.pollinations.ai/image/models',
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
					});

					if (Array.isArray(response)) {
						// Filter only image models (exclude video models)
						const imageModels = response.filter(
							(model: { output_modalities?: string[] }) =>
								model.output_modalities?.includes('image') &&
								!model.output_modalities?.includes('video'),
						);

						return imageModels.map(
							(model: {
								name: string;
								description: string;
								pricing?: { completionImageTokens?: number };
							}) => {
								let displayName = model.description || model.name;

								// Add pricing info if available
								if (model.pricing?.completionImageTokens) {
									const imagesPerPollen = Math.floor(1 / model.pricing.completionImageTokens);
									displayName += ` (~${imagesPerPollen.toLocaleString()} img/$)`;
								}

								return {
									name: displayName,
									value: model.name,
								};
							},
						);
					}

					// Fallback if API fails
					return [
						{ name: 'Flux Schnell', value: 'flux' },
						{ name: 'SDXL Turbo', value: 'turbo' },
						{ name: 'GPT Image 1 Mini', value: 'gptimage' },
						{ name: 'FLUX.1 Kontext', value: 'kontext' },
						{ name: 'Seedream 4.0', value: 'seedream' },
						{ name: 'NanoBanana', value: 'nanobanana' },
						{ name: 'NanoBanana Pro', value: 'nanobanana-pro' },
					];
				} catch {
					// Fallback if API fails
					return [
						{ name: 'Flux Schnell', value: 'flux' },
						{ name: 'SDXL Turbo', value: 'turbo' },
						{ name: 'GPT Image 1 Mini', value: 'gptimage' },
						{ name: 'FLUX.1 Kontext', value: 'kontext' },
						{ name: 'Seedream 4.0', value: 'seedream' },
					];
				}
			},

			async getTextModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('pollinationsApi');
					const apiKey = credentials.apiKey as string;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://gen.pollinations.ai/text/models',
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
					});

					if (Array.isArray(response)) {
						return response.map(
							(model: {
								name: string;
								description: string;
								pricing?: { completionTextTokens?: number };
							}) => {
								let displayName = model.description || model.name;

								// Add pricing info if available (cost per 1M output tokens)
								if (model.pricing?.completionTextTokens) {
									const costPerMillion = model.pricing.completionTextTokens * 1_000_000;
									displayName += ` ($${costPerMillion.toFixed(2)}/1M tok)`;
								}

								return {
									name: displayName,
									value: model.name,
								};
							},
						);
					}

					// Fallback if API fails
					return [
						{ name: 'OpenAI GPT-5 Mini', value: 'openai' },
						{ name: 'OpenAI GPT-5 Nano (Fast)', value: 'openai-fast' },
						{ name: 'OpenAI GPT-5.2 (Large)', value: 'openai-large' },
						{ name: 'Claude Sonnet 4.5', value: 'claude' },
						{ name: 'Claude (Fast)', value: 'claude-fast' },
						{ name: 'Claude (Large)', value: 'claude-large' },
						{ name: 'Gemini', value: 'gemini' },
						{ name: 'Gemini (Fast)', value: 'gemini-fast' },
						{ name: 'Gemini (Large)', value: 'gemini-large' },
						{ name: 'DeepSeek V3.2', value: 'deepseek' },
						{ name: 'Mistral', value: 'mistral' },
						{ name: 'Grok', value: 'grok' },
					];
				} catch {
					// Fallback if API fails
					return [
						{ name: 'OpenAI GPT-5 Mini', value: 'openai' },
						{ name: 'OpenAI GPT-5 Nano (Fast)', value: 'openai-fast' },
						{ name: 'OpenAI GPT-5.2 (Large)', value: 'openai-large' },
						{ name: 'Claude Sonnet 4.5', value: 'claude' },
						{ name: 'Mistral', value: 'mistral' },
						{ name: 'DeepSeek V3.2', value: 'deepseek' },
					];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;

			if (operation === 'generateImage') {
				const prompt = this.getNodeParameter('prompt', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				const options = this.getNodeParameter('options', i, {}) as {
					width?: number;
					height?: number;
					seed?: number;
					nologo?: boolean;
					enhance?: boolean;
					safe?: boolean;
				};

				// Get credentials
				const credentials = await this.getCredentials('pollinationsApi');
				const apiKey = credentials.apiKey as string;

				// Build query parameters
				const queryParams: Record<string, string> = {
					model,
				};

				if (options.width) {
					queryParams.width = options.width.toString();
				}
				if (options.height) {
					queryParams.height = options.height.toString();
				}
				if (options.seed) {
					queryParams.seed = options.seed.toString();
				}
				if (options.nologo) {
					queryParams.nologo = 'true';
				}
				if (options.enhance) {
					queryParams.enhance = 'true';
				}
				if (options.safe) {
					queryParams.safe = 'true';
				}

				// Build the URL
				const baseUrl = 'https://gen.pollinations.ai/image';
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
					encoding: 'arraybuffer',
					returnFullResponse: true,
				});

				// Calculate duration
				const duration = Date.now() - startTime;

				// Prepare binary data
				const binaryData = await this.helpers.prepareBinaryData(
					Buffer.from(response.body as ArrayBuffer),
					'image.png',
					'image/png',
				);

				// Build metadata for debugging
				const metadata = {
					request: {
						url: fullUrl,
						prompt,
						model,
						width: options.width || 1024,
						height: options.height || 1024,
						seed: options.seed || null,
						nologo: options.nologo || false,
						enhance: options.enhance || false,
						safe: options.safe || false,
					},
					response: {
						statusCode: response.statusCode,
						contentType: response.headers?.['content-type'] || 'image/png',
						contentLength: response.headers?.['content-length'] || null,
						duration: `${duration}ms`,
					},
					timestamp: new Date().toISOString(),
				};

				returnData.push({
					json: metadata,
					binary: {
						data: binaryData,
					},
				});
			}

			if (operation === 'generateText') {
				const prompt = this.getNodeParameter('textPrompt', i) as string;
				const model = this.getNodeParameter('textModel', i) as string;
				const systemPrompt = this.getNodeParameter('systemPrompt', i, '') as string;
				const temperature = this.getNodeParameter('temperature', i) as number;
				const textOptions = this.getNodeParameter('textOptions', i, {}) as {
					jsonMode?: boolean;
					seed?: number;
				};
				const jsonMode = textOptions.jsonMode || false;

				// Get credentials
				const credentials = await this.getCredentials('pollinationsApi');
				const apiKey = credentials.apiKey as string;

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

				// Build the URL
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
				let parsedJson = null;

				// If JSON mode, try to parse the response
				if (jsonMode) {
					try {
						parsedJson = JSON.parse(text);
					} catch {
						// Keep as string if parsing fails
					}
				}

				// Build metadata for debugging
				const metadata = {
					text: parsedJson || text,
					request: {
						url: fullUrl,
						prompt,
						model,
						system: systemPrompt || null,
						temperature,
						seed: textOptions.seed !== -1 ? textOptions.seed : null,
						jsonMode: jsonMode,
					},
					response: {
						statusCode: response.statusCode,
						contentType: response.headers?.['content-type'] || 'text/plain',
						duration: `${duration}ms`,
					},
					timestamp: new Date().toISOString(),
				};

				returnData.push({
					json: metadata,
				});
			}
		}

		return [returnData];
	}
}
