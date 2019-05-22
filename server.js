/* eslint-disable no-console */

const Provider = require('oidc-provider');
const express = require('express');
const helmet = require('helmet');
const debug = require('debug')('beame:oidc-ad-provider:server');

const configuration = require('./configuration');
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
(async () => {
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
	server = app.listen(configuration.port, () => {
		console.log(`Server started in ${configuration.runningAt}`);
		debug(`Discovery url: ${configuration.runningAt}/.well-known/openid-configuration`)
	});
})().catch((err) => {
	if (server && server.listening) server.close();
	console.error(err);
	process.exitCode = 1;
});
