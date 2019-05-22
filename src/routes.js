const querystring = require('querystring');
const { urlencoded } = require('express');
const nodeSSPI = require('node-sspi');
const debug = require('debug')('beame:oidc-ad-provider:routes');

const body = urlencoded({ extended: false });
const configuration = require('../configuration');
const Account = require('./account');

module.exports = (app, provider) => {
	const { constructor: { errors: { SessionNotFound } } } = provider;

	app.use((req, res, next) => {
		const orig = res.render;
		// you'll probably want to use a full blown render engine capable of layouts
		res.render = (view, locals) => {
			app.render(view, locals, (err, html) => {
				if (err) throw err;
				orig.call(res, '_layout', {
					...locals,
					body: html,
				});
			});
		};
		next();
	});

	function setNoCache(req, res, next) {
		res.set('Pragma', 'no-cache');
		res.set('Cache-Control', 'no-cache, no-store');
		next();
	}

	app.use('/auth', function (req, res, next) {
		var nodeSSPIObj = new nodeSSPI({
			retrieveGroups: true,
		});
		nodeSSPIObj.authenticate(req, res, function () {
			res.finished || next()
		})
	});
	app.use('/auth', async function (req, res, next) {
		debug(`AD authenticated: user ${req.connection.user}, sid ${req.connection.userSid}, groups ${req.connection.userGroups}`);
		let user = await Account.findByLogin(req.connection.userSid);
		user.setUserName(req.connection.user);
		user.setGroups(req.connection.userGroups);
		next()
	});

	app.get('/interaction/:grant', setNoCache, async (req, res, next) => {
		try {
			const details = await provider.interactionDetails(req);
			const client = await provider.Client.find(details.params.client_id);

			if (details.interaction.error === 'login_required') {
				return res.render('login', {
					client,
					details,
					title: 'Sign-in',
					params: querystring.stringify(details.params, ',<br/>', ' = ', {
						encodeURIComponent: value => value,
					}),
					interaction: querystring.stringify(details.interaction, ',<br/>', ' = ', {
						encodeURIComponent: value => value,
					}),
				});
			}
			return res.render('interaction', {
				client,
				details,
				title: 'Authorize',
				params: querystring.stringify(details.params, ',<br/>', ' = ', {
					encodeURIComponent: value => value,
				}),
				interaction: querystring.stringify(details.interaction, ',<br/>', ' = ', {
					encodeURIComponent: value => value,
				}),
			});
		} catch (err) {
			return next(err);
		}
	});

	app.post('/interaction/:grant/confirm', setNoCache, body, async (req, res, next) => {
		try {
			const result = { consent: {} };
			await provider.interactionFinished(req, res, result);
		} catch (err) {
			next(err);
		}
	});

	app.post('/interaction/:grant/login', setNoCache, body, async (req, res, next) => {
		try {
			const result = {
				login: {
					account: req.connection.userSid,
					acr: configuration.provider.acrValues[0],
					ts: Math.floor(Date.now() / 1000),
				},
				consent: {},
			};

			await provider.interactionFinished(req, res, result);
		} catch (err) {
			next(err);
		}
	});

	app.use((err, req, res, next) => {
		if (err instanceof SessionNotFound) {
			// handle interaction expired / session not found error
		}
		next(err);
	});
};
