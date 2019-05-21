const pkg = require('./package.json');

module.exports.port = process.env.BEAME_PORT || 3000;
module.exports.address = process.env.BEAME_ADDRESS || `http://localhost`;
module.exports.runningAt = `${this.address}:${this.port}`;
module.exports.certFqdn = process.env.BEAME_CERT_FQDN;
module.exports.timeout = process.env.BEAME_TIMEOUT;

if(!this.certFqdn) throw new Error('Cert Fqdn is mandatory. Please configure it using the BEAME_CERT_FQDN environment variable');

// map of ad groups to beame groups (eg: 'BUILTIN\\Users': [ 'login', 'register'])
module.exports.adGroupsMap = {
	'BUILTIN\\Users': 'login',
	'BEAMEIO\\Domain Users': [ 'register', 'login' ],
	'BEAMEIO\\Domain Admins': 'admin',
}

module.exports.clients = [
	{
		// http://localhost:3000/.well-known/openid-configuration
		// request by claim: http://localhost:3000/auth?client_id=foo&redirect_uri=https://lvh.me:8080/cb&response_type=id_token&nonce=222&state=3213424&scope=openid&claims=%7B%22id_token%22%3A%7B%22groups%22%3A%20%7B%22essential%22%3A%20true%7D%2C%22name%22%3A%20%7B%22essential%22%3A%20true%7D%7D%7D
		// request by scope: http://localhost:3000/auth?client_id=foo&redirect_uri=https://lvh.me:8080/cb&response_type=id_token&nonce=222&state=3213424&scope=openid+profile+groups
		client_id: 'foo',
		client_secret: 'bar',
		redirect_uris: ['https://lvh.me:8080/cb'],
		response_types: ['id_token'],
		grant_types: ['implicit'],
	},
];

module.exports.provider = Object.assign({
	acrValues: ['urn:mace:incommon:iap:bronze'],
	cookies: {
		long: { signed: true, maxAge: (1 * 24 * 60 * 60) * 1000 }, // 1 day in ms
		short: { signed: true },
		keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more'],
	},
	discovery: {
		service_documentation: pkg.homepage,
		version: [
			pkg.version
		].filter(Boolean).join('-'),
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
		//RegistrationAccessToken: 1 * 24 * 60 * 60, // 1 day in seconds
	},
});