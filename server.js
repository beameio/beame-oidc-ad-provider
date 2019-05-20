/* eslint-disable no-console */

const url = require('url');
const path = require('path');
const Provider = require('oidc-provider');
const express = require('express');
const helmet = require('helmet');

const routes = require('./src/routes');
const Account = require('./src/account');
const { PORT = 3000, ISSUER = `http://localhost:${PORT}`, TIMEOUT } = process.env;

const { provider: providerConfiguration, clients, keys } = require('./configuration');
providerConfiguration.findById = Account.findById;

const app = express();
app.use(helmet());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const provider = new Provider(ISSUER, providerConfiguration);

if (TIMEOUT) {
	provider.defaultHttpOptions = { timeout: parseInt(TIMEOUT, 10) };
}

let server;
(async () => {
	await provider.initialize({
		// adapter: require('./src/db_adapter'),
		clients,
		keystore: { keys },
	});

	if (process.env.NODE_ENV === 'production') {
		app.enable('trust proxy');
		provider.proxy = true;
		providerConfiguration.cookies.short.secure = true;
		providerConfiguration.cookies.long.secure = true;

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
					error_description: 'do yourself a favor and only use https',
				});
			}
		});
	}

	routes(app, provider);
	app.use('/', provider.callback);
	server = app.listen(PORT, () => {
		console.log(`application is listening on port ${PORT}, check it's /.well-known/openid-configuration`);
	});
})().catch((err) => {
	if (server && server.listening) server.close();
	console.error(err);
	process.exitCode = 1;
});
