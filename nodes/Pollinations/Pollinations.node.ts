import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INode,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Handle HTTP errors from Pollinations API with user-friendly messages
 */
function handlePollinationsError(
	error: unknown,
	node: INode,
	itemIndex: number,
	context?: string,
): never {
	const httpError = error as { response?: { status?: number }; message?: string };
	const status = httpError.response?.status;

	switch (status) {
		case 400:
			throw new NodeOperationError(
				node,
				`Invalid request: ${httpError.message || 'Check your input parameters'}`,
				{ itemIndex },
			);
		case 401:
			throw new NodeOperationError(
				node,
				'Authentication failed. Please check your API key is valid.',
				{ itemIndex },
			);
		case 402:
			throw new NodeOperationError(
				node,
				'Pollen balance exhausted. Please add more Pollen at https://enter.pollinations.ai',
				{ itemIndex },
			);
		case 403:
			if (context === 'balance') {
				throw new NodeOperationError(
					node,
					'API key does not have "Balance" permission. Please generate a new API key at https://enter.pollinations.ai with the "Balance" permission enabled.',
					{ itemIndex },
				);
			}
			throw new NodeOperationError(
				node,
				'Permission denied. Your API key may not have the required permissions for this operation.',
				{ itemIndex },
			);
		case 429:
			throw new NodeOperationError(
				node,
				'Rate limit exceeded. Please wait a moment before trying again.',
				{ itemIndex },
			);
		case 500:
		case 502:
		case 503:
			throw new NodeOperationError(
				node,
				'Pollinations API is temporarily unavailable. Please try again later.',
				{ itemIndex },
			);
		default:
			throw error;
	}
}

async function checkMinimumBalance(
	context: IExecuteFunctions,
	minimumBalance: number,
	itemIndex: number,
): Promise<void> {
	if (minimumBalance <= 0) return;

	const credentials = await context.getCredentials('pollinationsApi');
	const apiKey = credentials.apiKey as string;

	let response;
	try {
		response = await context.helpers.httpRequest({
			method: 'GET',
			url: 'https://gen.pollinations.ai/account/balance',
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
		});
	} catch (error: unknown) {
		handlePollinationsError(error, context.getNode(), itemIndex, 'balance');
	}

	const currentBalance = response.balance as number;
	if (currentBalance < minimumBalance) {
		throw new NodeOperationError(
			context.getNode(),
			`Insufficient balance: ${currentBalance} pollens available, ${minimumBalance} required`,
			{ itemIndex },
		);
	}
}

export class Pollinations implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pollinations',
		name: 'pollinations',
		icon: 'file:pollinations.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Generate images, text, speech and music using Pollinations AI',
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
						name: 'Generate Music',
						value: 'generateMusic',
						description: 'Generate music from a text prompt',
						action: 'Generate music from a text prompt',
					},
					{
						name: 'Generate Speech',
						value: 'generateSpeech',
						description: 'Convert text to speech using TTS',
						action: 'Convert text to speech',
					},
					{
						name: 'Generate Text',
						value: 'generateText',
						description: 'Generate text from a prompt using AI',
						action: 'Generate text from a prompt',
					},
					{
						name: 'Generate with Reference',
						value: 'generateImageWithReference',
						description: 'Generate an image using a reference image',
						action: 'Generate an image using a reference image',
					},
					{
						name: 'Get Balance',
						value: 'getBalance',
						description: 'Get current pollen balance from your account',
						action: 'Get current pollen balance',
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
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateImage'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getImageModels',
				},
				description: 'The model to use for image generation. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
						displayName: 'Enhance Prompt',
						name: 'enhance',
						type: 'boolean',
						default: false,
						description: 'Whether to automatically enhance the prompt for better results',
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
						displayName: 'Minimum Balance',
						name: 'minimumBalance',
						type: 'number',
						default: 0,
						description:
							'Minimum pollen balance required to execute. Set to 0 to disable check.',
						typeOptions: {
							minValue: 0,
						},
					},
					{
						displayName: 'No Logo',
						name: 'nologo',
						type: 'boolean',
						default: false,
						description: 'Whether to remove the Pollinations watermark',
					},
					{
						displayName: 'Safe Mode',
						name: 'safe',
						type: 'boolean',
						default: false,
						description: 'Whether to enable content safety filter',
					},
					{
						displayName: 'Seed',
						name: 'seed',
						type: 'number',
						default: 0,
						description: 'Seed for reproducible generation. Use 0 for random.',
					},
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
				],
			},

			// ==================== GENERATE IMAGE WITH REFERENCE ====================

			// Prompt (Reference)
			{
				displayName: 'Prompt',
				name: 'referencePrompt',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['generateImageWithReference'],
					},
				},
				description: 'The text prompt describing how to transform or use the reference image',
				typeOptions: {
					rows: 4,
				},
			},

			// Reference Image URL (Required)
			{
				displayName: 'Reference Image URL',
				name: 'referenceImage',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['generateImageWithReference'],
					},
				},
				placeholder: 'https://example.com/image.jpg',
				description: 'URL of the reference image. Must be publicly accessible.',
			},

			// Model (Reference) - Dynamic loading with image input support
			{
				displayName: 'Model Name or ID',
				name: 'referenceModel',
				type: 'options',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateImageWithReference'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getImageModelsWithReferenceSupport',
				},
				description: 'The model to use. Only models supporting image input are shown. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			// Advanced Options (Reference)
			{
				displayName: 'Options',
				name: 'referenceOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['generateImageWithReference'],
					},
				},
				options: [
					{
						displayName: 'Enhance Prompt',
						name: 'enhance',
						type: 'boolean',
						default: false,
						description: 'Whether to automatically enhance the prompt for better results',
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
						displayName: 'Minimum Balance',
						name: 'minimumBalance',
						type: 'number',
						default: 0,
						description:
							'Minimum pollen balance required to execute. Set to 0 to disable check.',
						typeOptions: {
							minValue: 0,
						},
					},
					{
						displayName: 'No Logo',
						name: 'nologo',
						type: 'boolean',
						default: false,
						description: 'Whether to remove the Pollinations watermark',
					},
					{
						displayName: 'Safe Mode',
						name: 'safe',
						type: 'boolean',
						default: false,
						description: 'Whether to enable content safety filter',
					},
					{
						displayName: 'Seed',
						name: 'seed',
						type: 'number',
						default: 0,
						description: 'Seed for reproducible generation. Use 0 for random.',
					},
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
				displayName: 'Model Name or ID',
				name: 'textModel',
				type: 'options',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateText'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getTextModels',
				},
				description: 'The AI model to use for text generation. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
						displayName: 'Minimum Balance',
						name: 'minimumBalance',
						type: 'number',
						default: 0,
						description:
							'Minimum pollen balance required to execute. Set to 0 to disable check.',
						typeOptions: {
							minValue: 0,
						},
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

			// ==================== GENERATE SPEECH ====================

			// Text (Speech)
			{
				displayName: 'Text',
				name: 'speechText',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['generateSpeech'],
					},
				},
				description: 'The text to convert to speech',
				typeOptions: {
					rows: 4,
				},
			},

			// Model (Speech) - Dynamic loading
			{
				displayName: 'Model Name or ID',
				name: 'speechModel',
				type: 'options',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateSpeech'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getAudioTTSModels',
				},
				description: 'The TTS model to use for speech generation. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			// Voice (Speech) - Dynamic loading
			{
				displayName: 'Voice Name or ID',
				name: 'voice',
				type: 'options',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateSpeech'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getTTSVoices',
				},
				description: 'The voice to use for speech synthesis. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			// Advanced Options (Speech)
			{
				displayName: 'Options',
				name: 'speechOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['generateSpeech'],
					},
				},
				options: [
					{
						displayName: 'Minimum Balance',
						name: 'minimumBalance',
						type: 'number',
						default: 0,
						description:
							'Minimum pollen balance required to execute. Set to 0 to disable check.',
						typeOptions: {
							minValue: 0,
						},
					},
					{
						displayName: 'Response Format',
						name: 'responseFormat',
						type: 'options',
						default: 'mp3',
						options: [
							{ name: 'AAC', value: 'aac' },
							{ name: 'FLAC', value: 'flac' },
							{ name: 'MP3', value: 'mp3' },
							{ name: 'Opus', value: 'opus' },
							{ name: 'PCM', value: 'pcm' },
							{ name: 'WAV', value: 'wav' },
						],
						description: 'The audio format of the output file',
					},
				],
			},

			// ==================== GENERATE MUSIC ====================

			// Prompt (Music)
			{
				displayName: 'Prompt',
				name: 'musicPrompt',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['generateMusic'],
					},
				},
				description: 'Description of the music to generate',
				typeOptions: {
					rows: 4,
				},
			},

			// Model (Music) - Dynamic loading
			{
				displayName: 'Model Name or ID',
				name: 'musicModel',
				type: 'options',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateMusic'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getAudioMusicModels',
				},
				description: 'The model to use for music generation. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			// Duration (Music)
			{
				displayName: 'Duration (Seconds)',
				name: 'duration',
				type: 'number',
				default: 30,
				displayOptions: {
					show: {
						operation: ['generateMusic'],
					},
				},
				description: 'Duration of the generated music in seconds',
				typeOptions: {
					minValue: 3,
					maxValue: 300,
				},
			},

			// Instrumental (Music)
			{
				displayName: 'Instrumental',
				name: 'instrumental',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['generateMusic'],
					},
				},
				description: 'Whether to generate instrumental music only (no vocals)',
			},

			// Advanced Options (Music)
			{
				displayName: 'Options',
				name: 'musicOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['generateMusic'],
					},
				},
				options: [
					{
						displayName: 'Minimum Balance',
						name: 'minimumBalance',
						type: 'number',
						default: 0,
						description:
							'Minimum pollen balance required to execute. Set to 0 to disable check.',
						typeOptions: {
							minValue: 0,
						},
					},
				],
			},
		],
		usableAsTool: true,
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
								paid_only?: boolean;
							}) => {
								let displayName = model.description || model.name;

								// Add pricing info if available
								if (model.pricing?.completionImageTokens) {
									const imagesPerPollen = Math.floor(1 / model.pricing.completionImageTokens);
									displayName += ` (~${imagesPerPollen.toLocaleString()} img/$)`;
								}

								if (model.paid_only) {
									displayName += ' [Paid]';
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
						{ name: 'FLUX.1 Kontext [Paid]', value: 'kontext' },
						{ name: 'Seedream 4.0 [Paid]', value: 'seedream' },
						{ name: 'NanoBanana [Paid]', value: 'nanobanana' },
						{ name: 'NanoBanana Pro [Paid]', value: 'nanobanana-pro' },
					];
				} catch {
					// Fallback if API fails
					return [
						{ name: 'Flux Schnell', value: 'flux' },
						{ name: 'SDXL Turbo', value: 'turbo' },
						{ name: 'GPT Image 1 Mini', value: 'gptimage' },
						{ name: 'FLUX.1 Kontext [Paid]', value: 'kontext' },
						{ name: 'Seedream 4.0 [Paid]', value: 'seedream' },
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
						// Filter only text models (exclude image/video models)
						const textModels = response.filter(
							(model: { output_modalities?: string[] }) =>
								model.output_modalities?.includes('text') &&
								!model.output_modalities?.includes('image') &&
								!model.output_modalities?.includes('video'),
						);

						return textModels.map(
							(model: {
								name: string;
								description: string;
								pricing?: { completionTextTokens?: number };
								paid_only?: boolean;
							}) => {
								let displayName = model.description || model.name;

								// Add pricing info if available (responses per pollen)
								if (model.pricing?.completionTextTokens) {
									const responsesPerPollen = Math.floor(1 / model.pricing.completionTextTokens);
									displayName += ` (~${responsesPerPollen.toLocaleString()} resp/$)`;
								}

								if (model.paid_only) {
									displayName += ' [Paid]';
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
						{ name: 'OpenAI GPT-4o Mini', value: 'openai' },
						{ name: 'OpenAI GPT-4o Mini (Fast)', value: 'openai-fast' },
						{ name: 'OpenAI GPT-4o (Large)', value: 'openai-large' },
						{ name: 'Claude Sonnet 3.5 [Paid]', value: 'claude' },
						{ name: 'Claude (Fast)', value: 'claude-fast' },
						{ name: 'Claude (Large) [Paid]', value: 'claude-large' },
						{ name: 'Gemini [Paid]', value: 'gemini' },
						{ name: 'Gemini (Fast)', value: 'gemini-fast' },
						{ name: 'Gemini (Large) [Paid]', value: 'gemini-large' },
						{ name: 'DeepSeek V3', value: 'deepseek' },
						{ name: 'Mistral', value: 'mistral' },
						{ name: 'Grok [Paid]', value: 'grok' },
					];
				} catch {
					// Fallback if API fails
					return [
						{ name: 'OpenAI GPT-4o Mini', value: 'openai' },
						{ name: 'OpenAI GPT-4o Mini (Fast)', value: 'openai-fast' },
						{ name: 'OpenAI GPT-4o (Large)', value: 'openai-large' },
						{ name: 'Claude Sonnet 3.5 [Paid]', value: 'claude' },
						{ name: 'Mistral', value: 'mistral' },
						{ name: 'DeepSeek V3', value: 'deepseek' },
					];
				}
			},

			async getImageModelsWithReferenceSupport(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
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
						// Filter only image models that support image input (for reference/transformation)
						const imageModels = response.filter(
							(model: { output_modalities?: string[]; input_modalities?: string[] }) =>
								model.output_modalities?.includes('image') &&
								!model.output_modalities?.includes('video') &&
								model.input_modalities?.includes('image'),
						);

						return imageModels.map(
							(model: {
								name: string;
								description: string;
								pricing?: { completionImageTokens?: number };
								paid_only?: boolean;
							}) => {
								let displayName = model.description || model.name;

								// Add pricing info if available
								if (model.pricing?.completionImageTokens) {
									const imagesPerPollen = Math.floor(1 / model.pricing.completionImageTokens);
									displayName += ` (~${imagesPerPollen.toLocaleString()} img/$)`;
								}

								if (model.paid_only) {
									displayName += ' [Paid]';
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
						{ name: 'FLUX.1 Kontext [Paid]', value: 'kontext' },
						{ name: 'NanoBanana [Paid]', value: 'nanobanana' },
						{ name: 'NanoBanana Pro [Paid]', value: 'nanobanana-pro' },
						{ name: 'Seedream 4.0 [Paid]', value: 'seedream' },
						{ name: 'GPT Image 1 Mini', value: 'gptimage' },
					];
				} catch {
					// Fallback if API fails
					return [
						{ name: 'FLUX.1 Kontext [Paid]', value: 'kontext' },
						{ name: 'NanoBanana [Paid]', value: 'nanobanana' },
						{ name: 'NanoBanana Pro [Paid]', value: 'nanobanana-pro' },
						{ name: 'Seedream 4.0 [Paid]', value: 'seedream' },
						{ name: 'GPT Image 1 Mini', value: 'gptimage' },
					];
				}
			},

			async getAudioTTSModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('pollinationsApi');
					const apiKey = credentials.apiKey as string;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://gen.pollinations.ai/audio/models',
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
					});

					if (Array.isArray(response)) {
						// Filter TTS models: audio output + has voices (distinguishes from music/STT)
						const ttsModels = response.filter(
							(model: { output_modalities?: string[]; voices?: string[] }) =>
								model.output_modalities?.includes('audio') &&
								Array.isArray(model.voices) &&
								model.voices.length > 0,
						);

						return ttsModels.map(
							(model: {
								name: string;
								description: string;
								pricing?: { completionAudioTokens?: number };
								paid_only?: boolean;
							}) => {
								let displayName = model.description || model.name;

								if (model.pricing?.completionAudioTokens) {
									const generationsPerPollen = Math.floor(
										1 / model.pricing.completionAudioTokens,
									);
									displayName += ` (~${generationsPerPollen.toLocaleString()} gen/$)`;
								}

								if (model.paid_only) {
									displayName += ' [Paid]';
								}

								return {
									name: displayName,
									value: model.name,
								};
							},
						);
					}

					// Fallback if API fails
					return [{ name: 'ElevenLabs TTS', value: 'elevenlabs' }];
				} catch {
					return [{ name: 'ElevenLabs TTS', value: 'elevenlabs' }];
				}
			},

			async getTTSVoices(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('pollinationsApi');
					const apiKey = credentials.apiKey as string;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://gen.pollinations.ai/audio/models',
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
					});

					if (Array.isArray(response)) {
						// Collect unique voices from all TTS models
						const voiceSet = new Set<string>();
						for (const model of response) {
							if (
								Array.isArray(model.voices) &&
								model.output_modalities?.includes('audio')
							) {
								for (const voice of model.voices) {
									voiceSet.add(voice as string);
								}
							}
						}

						const voices = Array.from(voiceSet).sort();
						return voices.map((voice) => ({
							name: voice.charAt(0).toUpperCase() + voice.slice(1),
							value: voice,
						}));
					}

					// Fallback
					return [
						{ name: 'Alloy', value: 'alloy' },
						{ name: 'Echo', value: 'echo' },
						{ name: 'Fable', value: 'fable' },
						{ name: 'Nova', value: 'nova' },
						{ name: 'Onyx', value: 'onyx' },
						{ name: 'Shimmer', value: 'shimmer' },
					];
				} catch {
					return [
						{ name: 'Alloy', value: 'alloy' },
						{ name: 'Echo', value: 'echo' },
						{ name: 'Fable', value: 'fable' },
						{ name: 'Nova', value: 'nova' },
						{ name: 'Onyx', value: 'onyx' },
						{ name: 'Shimmer', value: 'shimmer' },
					];
				}
			},

			async getAudioMusicModels(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('pollinationsApi');
					const apiKey = credentials.apiKey as string;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://gen.pollinations.ai/audio/models',
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
					});

					if (Array.isArray(response)) {
						// Filter music models: audio output, no voices (not TTS), no audio input (not STT)
						const musicModels = response.filter(
							(model: {
								output_modalities?: string[];
								input_modalities?: string[];
								voices?: string[];
							}) =>
								model.output_modalities?.includes('audio') &&
								(!Array.isArray(model.voices) || model.voices.length === 0) &&
								!model.input_modalities?.includes('audio'),
						);

						return musicModels.map(
							(model: {
								name: string;
								description: string;
								pricing?: { completionAudioTokens?: number };
								paid_only?: boolean;
							}) => {
								let displayName = model.description || model.name;

								if (model.pricing?.completionAudioTokens) {
									const generationsPerPollen = Math.floor(
										1 / model.pricing.completionAudioTokens,
									);
									displayName += ` (~${generationsPerPollen.toLocaleString()} gen/$)`;
								}

								if (model.paid_only) {
									displayName += ' [Paid]';
								}

								return {
									name: displayName,
									value: model.name,
								};
							},
						);
					}

					// Fallback if API fails
					return [{ name: 'ElevenLabs Music', value: 'elevenmusic' }];
				} catch {
					return [{ name: 'ElevenLabs Music', value: 'elevenmusic' }];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		// Handle account operations outside the loop (they don't depend on input items)
		if (operation === 'getBalance') {
			const credentials = await this.getCredentials('pollinationsApi');
			const apiKey = credentials.apiKey as string;

			let response;
			try {
				response = await this.helpers.httpRequest({
					method: 'GET',
					url: 'https://gen.pollinations.ai/account/balance',
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
				});
			} catch (error: unknown) {
				handlePollinationsError(error, this.getNode(), 0, 'balance');
			}

			returnData.push({
				json: response,
			});

			return [returnData];
		}

		for (let i = 0; i < items.length; i++) {

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
					minimumBalance?: number;
				};

				// Check minimum balance if configured
				const minimumBalance = options.minimumBalance || 0;
				await checkMinimumBalance(this, minimumBalance, i);

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
				let response;
				try {
					response = await this.helpers.httpRequest({
						method: 'GET',
						url: fullUrl,
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						encoding: 'arraybuffer',
						returnFullResponse: true,
					});
				} catch (error: unknown) {
					handlePollinationsError(error, this.getNode(), i, 'image');
				}

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
					minimumBalance?: number;
				};
				const jsonMode = textOptions.jsonMode || false;

				// Check minimum balance if configured
				const minimumBalance = textOptions.minimumBalance || 0;
				await checkMinimumBalance(this, minimumBalance, i);

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
				let response;
				try {
					response = await this.helpers.httpRequest({
						method: 'GET',
						url: fullUrl,
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						returnFullResponse: true,
					});
				} catch (error: unknown) {
					handlePollinationsError(error, this.getNode(), i, 'text');
				}

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

			if (operation === 'generateImageWithReference') {
				const prompt = this.getNodeParameter('referencePrompt', i) as string;
				const referenceImage = this.getNodeParameter('referenceImage', i) as string;
				const model = this.getNodeParameter('referenceModel', i) as string;
				const options = this.getNodeParameter('referenceOptions', i, {}) as {
					width?: number;
					height?: number;
					seed?: number;
					nologo?: boolean;
					enhance?: boolean;
					safe?: boolean;
					minimumBalance?: number;
				};

				// Check minimum balance if configured
				const minimumBalance = options.minimumBalance || 0;
				await checkMinimumBalance(this, minimumBalance, i);

				// Validate reference image URL
				try {
					new URL(referenceImage);
				} catch {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid reference image URL: "${referenceImage}"`,
						{ itemIndex: i },
					);
				}

				// Get credentials
				const credentials = await this.getCredentials('pollinationsApi');
				const apiKey = credentials.apiKey as string;

				// Build query parameters
				const queryParams: Record<string, string> = {
					model,
					image: referenceImage,
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
				let response;
				try {
					response = await this.helpers.httpRequest({
						method: 'GET',
						url: fullUrl,
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						encoding: 'arraybuffer',
						returnFullResponse: true,
					});
				} catch (error: unknown) {
					handlePollinationsError(error, this.getNode(), i, 'image');
				}

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
						referenceImage,
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

			if (operation === 'generateSpeech') {
				const text = this.getNodeParameter('speechText', i) as string;
				const model = this.getNodeParameter('speechModel', i) as string;
				const voice = this.getNodeParameter('voice', i) as string;
				const speechOptions = this.getNodeParameter('speechOptions', i, {}) as {
					responseFormat?: string;
					minimumBalance?: number;
				};

				// Check minimum balance if configured
				const minimumBalance = speechOptions.minimumBalance || 0;
				await checkMinimumBalance(this, minimumBalance, i);

				// Get credentials
				const credentials = await this.getCredentials('pollinationsApi');
				const apiKey = credentials.apiKey as string;

				// Build query parameters
				const responseFormat = speechOptions.responseFormat || 'mp3';
				const queryParams: Record<string, string> = {
					model,
					voice,
					response_format: responseFormat,
				};

				// Build the URL
				const baseUrl = 'https://gen.pollinations.ai/audio';
				const encodedText = encodeURIComponent(text);
				const queryString = new URLSearchParams(queryParams).toString();
				const fullUrl = `${baseUrl}/${encodedText}?${queryString}`;

				// Record start time
				const startTime = Date.now();

				// Make the request
				let response;
				try {
					response = await this.helpers.httpRequest({
						method: 'GET',
						url: fullUrl,
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						encoding: 'arraybuffer',
						returnFullResponse: true,
					});
				} catch (error: unknown) {
					handlePollinationsError(error, this.getNode(), i, 'audio');
				}

				// Calculate duration
				const duration = Date.now() - startTime;

				// MIME type mapping
				const mimeTypes: Record<string, string> = {
					mp3: 'audio/mpeg',
					opus: 'audio/opus',
					aac: 'audio/aac',
					flac: 'audio/flac',
					wav: 'audio/wav',
					pcm: 'audio/pcm',
				};

				const mimeType = mimeTypes[responseFormat] || 'audio/mpeg';
				const extension = responseFormat === 'mp3' ? 'mp3' : responseFormat;

				// Prepare binary data
				const binaryData = await this.helpers.prepareBinaryData(
					Buffer.from(response.body as ArrayBuffer),
					`speech.${extension}`,
					mimeType,
				);

				// Build metadata
				const metadata = {
					request: {
						url: fullUrl,
						text,
						model,
						voice,
						responseFormat,
					},
					response: {
						statusCode: response.statusCode,
						contentType: response.headers?.['content-type'] || mimeType,
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

			if (operation === 'generateMusic') {
				const prompt = this.getNodeParameter('musicPrompt', i) as string;
				const model = this.getNodeParameter('musicModel', i) as string;
				const musicDuration = this.getNodeParameter('duration', i) as number;
				const instrumental = this.getNodeParameter('instrumental', i) as boolean;
				const musicOptions = this.getNodeParameter('musicOptions', i, {}) as {
					minimumBalance?: number;
				};

				// Check minimum balance if configured
				const minimumBalance = musicOptions.minimumBalance || 0;
				await checkMinimumBalance(this, minimumBalance, i);

				// Get credentials
				const credentials = await this.getCredentials('pollinationsApi');
				const apiKey = credentials.apiKey as string;

				// Build query parameters
				const queryParams: Record<string, string> = {
					model,
					duration: musicDuration.toString(),
				};

				if (instrumental) {
					queryParams.instrumental = 'true';
				}

				// Build the URL
				const baseUrl = 'https://gen.pollinations.ai/audio';
				const encodedPrompt = encodeURIComponent(prompt);
				const queryString = new URLSearchParams(queryParams).toString();
				const fullUrl = `${baseUrl}/${encodedPrompt}?${queryString}`;

				// Record start time
				const startTime = Date.now();

				// Make the request
				let response;
				try {
					response = await this.helpers.httpRequest({
						method: 'GET',
						url: fullUrl,
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						encoding: 'arraybuffer',
						returnFullResponse: true,
					});
				} catch (error: unknown) {
					handlePollinationsError(error, this.getNode(), i, 'audio');
				}

				// Calculate duration
				const duration = Date.now() - startTime;

				// Prepare binary data
				const binaryData = await this.helpers.prepareBinaryData(
					Buffer.from(response.body as ArrayBuffer),
					'music.mp3',
					'audio/mpeg',
				);

				// Build metadata
				const metadata = {
					request: {
						url: fullUrl,
						prompt,
						model,
						duration: musicDuration,
						instrumental,
					},
					response: {
						statusCode: response.statusCode,
						contentType: response.headers?.['content-type'] || 'audio/mpeg',
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
		}

		return [returnData];
	}
}
