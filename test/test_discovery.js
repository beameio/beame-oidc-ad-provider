"use strict";

const assert = require('assert').strict;
const fetch = require('node-fetch');
const decache = require('decache');
let configuration, debug, server;

describe('discovery', function() {
	this.timeout(10000);

	beforeEach(() => {
		configuration = require("../configuration");
		debug = require("debug")(configuration.debugPrefix + "tests:discovery");
	});

	afterEach(async () => {
		if(server && server.listening) {
			await server.close();
			debug('Server stopped');
		}
		decache('../server');
		decache('../configuration');
	});

	it('activated', async () => {
		server = await require('../server').server;
		debug('Server started');

		const res = await fetch(`${configuration.runningAt}/.well-known/openid-configuration`);
		assert(res.ok);

		const response = await res.json();
		debug(JSON.stringify(response));
		assert(response);
	});

	it('deactivated', async () => {
		configuration.provider.features.discovery = false;
		server = await require('../server').server;
		debug('Server started');

		const res = await fetch(`${configuration.runningAt}/.well-known/openid-configuration`)
			.catch(err => debug(`All good, url not available: ${err}`));
		assert(!res.ok);
	});
});
