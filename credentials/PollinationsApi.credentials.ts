import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PollinationsApi implements ICredentialType {
	name = 'pollinationsApi';
	displayName = 'Pollinations API';
	documentationUrl = 'https://github.com/new-xmon-df/n8n-nodes-pollinations-ai#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your Pollinations API Key (pk_ or sk_). Get it at https://enter.pollinations.ai. The available models will be filtered based on your key permissions.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://gen.pollinations.ai',
			url: '/image/models',
		},
	};
}
