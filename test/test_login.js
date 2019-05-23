"use strict";

const assert = require('assert').strict;
const fetch = require('node-fetch');
const decache = require('decache');
const configuration = require("../configuration");
const debug = require("debug")(configuration.debugPrefix + "tests:login");
let server;

describe('login', function() {
	this.timeout(10000);

	beforeEach(async () => {
		server = await require('../server').server;
		debug('Server started');
	});

	afterEach(async () => {
		if(server && server.listening) {
			await server.close();
			debug('Server stopped');
		}
		decache('../server');
		decache('../configuration');
	});

	it('unauthenticated', async () => {
		const url = `${configuration.runningAt}/auth?client_id=${configuration.clients[0].client_id}&redirect_uri=${configuration.clients[0].redirect_uris[0]}&response_type=${configuration.clients[0].response_types[0]}&nonce=222&state=3213424&scope=openid+profile+groups`;
		const res = await fetch(url, {redirect: 'follow'});

		debug(res);
		assert.equal(res.status, 401);
		assert.equal(res.statusText, 'Unauthorized');
	});

});
