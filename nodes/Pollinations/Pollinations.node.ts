import {
	IExecuteFunctions,
	INodeExecutionData,
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
		description: 'Generate images using Pollinations AI',
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
				],
				default: 'generateImage',
			},

			// Prompt (Basic)
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

			// Model (Basic)
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
				options: [
					{
						name: 'Flux (Default)',
						value: 'flux',
						description: 'High quality image generation model',
					},
					{
						name: 'Turbo',
						value: 'turbo',
						description: 'Faster generation with good quality',
					},
					{
						name: 'GPT Image',
						value: 'gptimage',
						description: 'OpenAI DALL-E style generation',
					},
					{
						name: 'Kontext',
						value: 'kontext',
						description: 'Context-aware image generation (strict content filter)',
					},
					{
						name: 'Seedream',
						value: 'seedream',
						description: 'Dream-like artistic images',
					},
					{
						name: 'Nanobanana',
						value: 'nanobanana',
						description: 'Lightweight fast model',
					},
					{
						name: 'Nanobanana Pro',
						value: 'nanobanana-pro',
						description: 'Enhanced nanobanana model',
					},
				],
				description: 'The model to use for image generation',
			},

			// Advanced Options
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
		],
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
				const baseUrl = 'https://image.pollinations.ai/prompt';
				const encodedPrompt = encodeURIComponent(prompt);
				const queryString = new URLSearchParams(queryParams).toString();
				const fullUrl = `${baseUrl}/${encodedPrompt}?${queryString}`;

				// Record start time
				const startTime = Date.now();

				// Make the request
				const response = await this.helpers.httpRequest({
					method: 'GET',
					url: fullUrl,
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
		}

		return [returnData];
	}
}
