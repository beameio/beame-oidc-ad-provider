/* eslint-disable no-console */

const Provider = require('oidc-provider');
const express = require('express');
const helmet = require('helmet');
const configuration = require('./configuration');
const debug = require('debug')(configuration.debugPrefix + 'server');

const routes = require('./src/routes');
configuration.provider.findById = require('./src/account').findById;

const beameSDK    = require('beame-sdk');
const beameStore = new beameSDK.BeameStore();

const app = express();
app.use(helmet());

const provider = new Provider(configuration.runningAt, configuration.provider);

if (configuration.timeout) {
	provider.defaultHttpOptions = { timeout: parseInt(configuration.timeout, 10) };
}

let server;
module.exports.server = (async () => {
	debug(`Getting credential for ${configuration.certFqdn}`);
	const cred = beameStore.getCredential(configuration.certFqdn);
	debug(`Got credential ${JSON.stringify(cred.metadata)}`);
	const key = await Provider.asKey(cred.PRIVATE_KEY, 'pem');
	debug(`Credential asKey became ${JSON.stringify(key)}`);

	await provider.initialize({
		clients: configuration.clients,
		keystore: { keys: [ key ] },
	});

	routes(app, provider);
	app.use('/', provider.callback);

	server = await app.listen(configuration.port);
	console.log(`Server started in ${configuration.runningAt}`);
	if(configuration.provider.features.discovery)
		debug(`Discovery url: ${configuration.runningAt}/.well-known/openid-configuration`)
	return server;
})().catch((err) => {
	if (server && server.listening) server.close();
	console.error(err);
	process.exitCode = 1;
});

module.exports.server = this.server;