import {
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
		requestDefaults: {
			baseURL: 'https://gen.pollinations.ai',
		},
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
						routing: {
							request: {
								method: 'GET',
								url: '=/image/{{encodeURIComponent($parameter["prompt"])}}',
								encoding: 'arraybuffer',
							},
							output: {
								postReceive: [
									{
										type: 'binaryData',
										properties: {
											destinationProperty: 'data',
										},
									},
								],
							},
						},
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
						description: 'Context-aware image generation',
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
				routing: {
					send: {
						type: 'query',
						property: 'model',
					},
				},
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
						routing: {
							send: {
								type: 'query',
								property: 'width',
							},
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
						routing: {
							send: {
								type: 'query',
								property: 'height',
							},
						},
					},
					{
						displayName: 'Seed',
						name: 'seed',
						type: 'number',
						default: 0,
						description: 'Seed for reproducible generation. Use 0 for random.',
						routing: {
							send: {
								type: 'query',
								property: 'seed',
								value: '={{$value || undefined}}',
							},
						},
					},
					{
						displayName: 'No Logo',
						name: 'nologo',
						type: 'boolean',
						default: false,
						description: 'Whether to remove the Pollinations watermark',
						routing: {
							send: {
								type: 'query',
								property: 'nologo',
								value: '={{$value ? "true" : undefined}}',
							},
						},
					},
					{
						displayName: 'Enhance Prompt',
						name: 'enhance',
						type: 'boolean',
						default: false,
						description: 'Whether to automatically enhance the prompt for better results',
						routing: {
							send: {
								type: 'query',
								property: 'enhance',
								value: '={{$value ? "true" : undefined}}',
							},
						},
					},
					{
						displayName: 'Safe Mode',
						name: 'safe',
						type: 'boolean',
						default: false,
						description: 'Whether to enable content safety filter',
						routing: {
							send: {
								type: 'query',
								property: 'safe',
								value: '={{$value ? "true" : undefined}}',
							},
						},
					},
				],
			},
		],
	};
}
