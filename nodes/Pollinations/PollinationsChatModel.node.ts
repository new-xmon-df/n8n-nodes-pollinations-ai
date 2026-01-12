import type {
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { ChatOpenAI } from '@langchain/openai';

export class PollinationsChatModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pollinations Chat Model',
		name: 'pollinationsChatModel',
		icon: 'file:pollinations.svg',
		group: ['transform'],
		version: 1,
		description: 'Use Pollinations AI chat models with AI Agents and LLM Chains',
		defaults: {
			name: 'Pollinations Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Chat Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://enter.pollinations.ai/api/docs',
					},
				],
			},
		},
		// Sub-node: no main inputs, output is ai_languageModel
		inputs: [],
		outputs: ['ai_languageModel'],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'pollinationsApi',
				required: true,
			},
		],
		properties: [
			// Model - dynamic loading
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				default: 'openai',
				typeOptions: {
					loadOptionsMethod: 'getChatModels',
				},
				description: 'The model to use for chat completions',
			},
			// Temperature
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 1,
				typeOptions: {
					minValue: 0,
					maxValue: 2,
					numberPrecision: 1,
				},
				description: 'Controls randomness: 0 = deterministic, 2 = very creative',
			},
			// Options collection
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Max Tokens',
						name: 'maxTokens',
						type: 'number',
						default: 0,
						description: 'Maximum tokens in response. 0 uses model default.',
						typeOptions: {
							minValue: 0,
						},
					},
					{
						displayName: 'Top P',
						name: 'topP',
						type: 'number',
						default: 1,
						typeOptions: {
							minValue: 0,
							maxValue: 1,
							numberPrecision: 2,
						},
						description: 'Nucleus sampling: consider tokens with top_p probability mass',
					},
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						type: 'number',
						default: 0,
						typeOptions: {
							minValue: -2,
							maxValue: 2,
							numberPrecision: 1,
						},
						description: 'Reduce repetition of token sequences. Higher values decrease repetition.',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						type: 'number',
						default: 0,
						typeOptions: {
							minValue: -2,
							maxValue: 2,
							numberPrecision: 1,
						},
						description: 'Increase likelihood of new topics. Higher values encourage novelty.',
					},
					{
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						default: 60000,
						typeOptions: {
							minValue: 1000,
						},
						description: 'Request timeout in milliseconds',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getChatModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
							}) => {
								let displayName = model.description || model.name;

								// Add pricing info if available (responses per pollen)
								if (model.pricing?.completionTextTokens) {
									const responsesPerPollen = Math.floor(1 / model.pricing.completionTextTokens);
									displayName += ` (~${responsesPerPollen.toLocaleString()} resp/$)`;
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
						{ name: 'Claude Sonnet 3.5', value: 'claude' },
						{ name: 'Claude (Fast)', value: 'claude-fast' },
						{ name: 'Claude (Large)', value: 'claude-large' },
						{ name: 'Gemini', value: 'gemini' },
						{ name: 'Gemini (Fast)', value: 'gemini-fast' },
						{ name: 'Gemini (Large)', value: 'gemini-large' },
						{ name: 'DeepSeek V3', value: 'deepseek' },
						{ name: 'Mistral', value: 'mistral' },
						{ name: 'Grok', value: 'grok' },
					];
				} catch {
					// Fallback if API fails
					return [
						{ name: 'OpenAI GPT-4o Mini', value: 'openai' },
						{ name: 'OpenAI GPT-4o Mini (Fast)', value: 'openai-fast' },
						{ name: 'OpenAI GPT-4o (Large)', value: 'openai-large' },
						{ name: 'Claude Sonnet 3.5', value: 'claude' },
						{ name: 'Mistral', value: 'mistral' },
						{ name: 'DeepSeek V3', value: 'deepseek' },
					];
				}
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions): Promise<SupplyData> {
		const credentials = await this.getCredentials('pollinationsApi');
		const apiKey = credentials.apiKey as string;

		const model = this.getNodeParameter('model', 0) as string;
		const temperature = this.getNodeParameter('temperature', 0) as number;
		const options = this.getNodeParameter('options', 0, {}) as {
			maxTokens?: number;
			topP?: number;
			frequencyPenalty?: number;
			presencePenalty?: number;
			timeout?: number;
		};

		const chatModel = new ChatOpenAI({
			model,
			temperature,
			maxTokens: options.maxTokens || undefined,
			topP: options.topP,
			frequencyPenalty: options.frequencyPenalty,
			presencePenalty: options.presencePenalty,
			timeout: options.timeout,
			configuration: {
				baseURL: 'https://gen.pollinations.ai/v1',
			},
			apiKey,
		});

		return {
			response: chatModel,
		};
	}
}
