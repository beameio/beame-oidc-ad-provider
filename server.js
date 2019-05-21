/* eslint-disable no-console */

const url = require('url');
const path = require('path');
const Provider = require('oidc-provider');
const express = require('express');
const helmet = require('helmet');
const debug = require('debug')('beame:oidc-ad-provider:server');

const configuration = require('./configuration');
const routes = require('./src/routes');
configuration.provider.findById = require('./src/account').findById;


const app = express();
app.use(helmet());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const provider = new Provider(configuration.issuer, configuration.provider);

if (configuration.timeout) {
	provider.defaultHttpOptions = { timeout: parseInt(configuration.timeout, 10) };
}

let server;
(async () => {
	await provider.initialize({
		// adapter: require('./src/db_adapter'),
		clients: configuration.clients,
		keystore: { keys: configuration.keys },
	});

	if (process.env.NODE_ENV === 'production') {
		app.enable('trust proxy');
		provider.proxy = true;
		configuration.provider.cookies.short.secure = true;
		configuration.provider.cookies.long.secure = true;

		app.use((req, res, next) => {
			if (req.secure) {
				next();
			} else if (req.method === 'GET' || req.method === 'HEAD') {
				res.redirect(url.format({
					protocol: 'https',
					host: req.get('host'),
					pathname: req.originalUrl,
				}));
			} else {
				res.status(400).json({
					error: 'invalid_request',
					error_description: 'only use https',
				});
			}
		});
	}

	routes(app, provider);
	app.use('/', provider.callback);
	server = app.listen(configuration.port, () => {
		console.log(`Server started as ${configuration.issuer}`);
		debug(`Discovery url: ${configuration.issuer}/.well-known/openid-configuration`)
	});
})().catch((err) => {
	if (server && server.listening) server.close();
	console.error(err);
	process.exitCode = 1;
});
