const nodeSSPI = require('node-sspi');
const configuration = require('../configuration');
const debug = require('debug')(configuration.DebugPrefix + 'routes');

const Account = require('./account');

module.exports = (app, provider) => {
	app.use('/interaction/:grant', function (req, res, next) { // start authentication against AD
		const nodeSSPIObj = new nodeSSPI({
			retrieveGroups: true,
		});
		nodeSSPIObj.authenticate(req, res, function () {
			res.finished || next()
		})
	});

	app.get('/interaction/:grant', async (req, res, next) => { // once authenticated, proceed and finish interaction
		try {
			debug(`AD authenticated: user ${req.connection.user}, sid ${req.connection.userSid}, groups ${req.connection.userGroups}`);
			let user = await Account.findById(null, req.connection.userSid);
			user.setUserName(req.connection.user);
			user.setGroups(req.connection.userGroups);
	
			const result = {
				login: {
					account: req.connection.userSid,
					ts: Math.floor(Date.now() / 1000),
				},
				consent: {},
			};

			await provider.interactionFinished(req, res, result);
		} catch (err) {
			next(err);
		}
	});
};
