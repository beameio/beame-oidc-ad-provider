const pkg = require('./package.json');

const envs = {
	_COMMON: {
		CertFqdn: undefined,
		DebugPrefix: "beame:oidc-ad-provider:",
		ProviderUseHttps: 0,
		ProviderPort: 50000,
		ProviderAddress: undefined,
		Timeout: undefined,
	}
};
module.exports = require('beame-sdk').makeEnv(envs);

if(!module.exports.CertFqdn) throw new Error('Cert Fqdn is mandatory. Please configure it using the BEAME_CERT_FQDN environment variable');

const address = module.exports.ProviderAddress || module.exports.ProviderUseHttps ? `https://${module.exports.CertFqdn}` : 'http://localhost';
module.exports.runningAt = `${address}:${module.exports.ProviderPort}`;

// map of ad groups to beame groups (eg: 'BUILTIN\\Users': [ 'login', 'register'])
module.exports.adGroupsMap = {
	'BUILTIN\\Users': 'login',
	'BEAMEIO\\Domain Users': [ 'register', 'login' ],
	'BEAMEIO\\Domain Admins': 'admin',
	'Group': 'othergroup',
};

module.exports.clients = [
	{
		// http://localhost:50000/.well-known/openid-configuration
		// request by claim: http://localhost:50000/auth?client_id=local_test&redirect_uri=https://test_fqdn:3022/cb&response_type=id_token&nonce=222&state=3213424&scope=openid&claims=%7B%22id_token%22%3A%7B%22groups%22%3A%20%7B%22essential%22%3A%20true%7D%2C%22name%22%3A%20%7B%22essential%22%3A%20true%7D%7D%7D
		// request by scope: http://localhost:50000/auth?client_id=local_test&redirect_uri=https://test_fqdn:3022/cb&response_type=id_token&nonce=222&state=3213424&scope=openid+profile+groups
		// https://tvv9dtpcjuqgwtfp.v1.p.beameio.net:50000/auth?client_id=local_test&redirect_uri=https://test_fqdn:3022/cb&response_type=id_token&nonce=222&state=3213424&scope=openid+profile+groups
		response_types: [ 'id_token' ],
		grant_types: [ 'implicit' ],
		client_id: 'local_test',
		client_secret: 'local_test_password',
		redirect_uris: [ 'https://test_fqdn:3022/cb' ],
	},
	{
		client_id: 'invitation_page',
		client_secret: 'invitation_page_password',
		redirect_uris: [ 'https://localhost:3000/oidc/cb' ],
		response_types: [ 'code' ],
		grant_types: [ 'authorization_code' ],
	},
	{
		client_id: 'beame_gatekeeper',
		client_secret: 'beame_gatekeeper_password',
		redirect_uris: [ 'https://h45329mcowcwa1j1.v1.p.beameio.net/oidc/cb' ],
		response_types: [ 'code' ],
		grant_types: [ 'authorization_code' ],
	},
];

module.exports.provider = Object.assign({
	cookies: {
		long: { signed: true, maxAge: (1 * 24 * 60 * 60) * 1000 }, // 1 day in ms
		short: { signed: true },
		keys: [ require('uuid/v4')() ],
	},
	discovery: {
		service_documentation: pkg.homepage,
		version: pkg.version
	},
	claims: {
		amr: null,
		address: ['address'],
		email: ['email', 'email_verified'],
		phone: ['phone_number', 'phone_number_verified'],
		profile: ['birthdate', 'family_name', 'gender', 'given_name', 'locale', 'middle_name', 'name',
			'nickname', 'picture', 'preferred_username', 'profile', 'updated_at', 'website', 'zoneinfo'],
		groups: ['groups'],
	},
	features: {
		devInteractions: false, // defaults to true
		discovery: true, // defaults to true
		// requestUri: true, // defaults to true
		// oauthNativeApps: true, // defaults to true
		// pkce: true, // defaults to true
		//backchannelLogout: true, // defaults to false
		claimsParameter: true, // defaults to false
		//deviceFlow: true, // defaults to false
		encryption: true, // defaults to false
		//frontchannelLogout: true, // defaults to false
		introspection: true, // defaults to false
		//jwtIntrospection: true, // defaults to false
		//jwtResponseModes: true, // defaults to false
		registration: true, // defaults to false
		request: true, // defaults to false
		revocation: true, // defaults to false
		//sessionManagement: true, // defaults to false
		//webMessageResponseMode: true, // defaults to false
	},
	formats: {
		default: 'opaque',
		AccessToken: 'jwt',
	},
	interactionUrl: function interactionUrl(ctx, interaction) { // eslint-disable-line no-unused-vars
		return `/interaction/${ctx.oidc.uuid}`;
	},
	clientCacheDuration: 1 * 24 * 60 * 60, // 1 day in seconds,
	ttl: {
		AccessToken: 1 * 60 * 60, // 1 hour in seconds
		AuthorizationCode: 10 * 60, // 10 minutes in seconds
		IdToken: 1 * 60 * 60, // 1 hour in seconds
		DeviceCode: 10 * 60, // 10 minutes in seconds
		RefreshToken: 1 * 24 * 60 * 60, // 1 day in seconds

		// if you want to drop dynamic registrations 24 hours after registration
		// RegistrationAccessToken: 1 * 24 * 60 * 60, // 1 day in seconds
	},
});
