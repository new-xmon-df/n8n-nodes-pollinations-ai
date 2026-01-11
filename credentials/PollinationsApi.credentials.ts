import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PollinationsApi implements ICredentialType {
	name = 'pollinationsApi';
	displayName = 'Pollinations API';
	documentationUrl = 'https://enter.pollinations.ai/api/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Pollinations API Key (pk_ or sk_). Get it at https://enter.pollinations.ai',
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
}
