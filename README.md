# beame-oidc-ad-provider
Beame oidc provider for mapping windows active directory groups to beame groups

`WARNING:` This provider will only work in `Windows` because of the node-sspi dependency

## Active directory
This provider integrates to active directory by using SSPI. 
It makes the project only run on windows, but it also allows an SSO experience in a windows enterprise network.
This is archieved by the usage of the module node-sspi (https://github.com/abbr/nodesspi https://www.npmjs.com/package/node-sspi) 

## OpenId Connect
The openid provider is accomplished by the usage of the module oidc-provider (https://github.com/panva/node-oidc-provider/tree/v5.x https://www.npmjs.com/package/oidc-provider)

### Discovery
Discovery is connected by default and available under the `/.well-known/openid-configuration` endpoint.
To disable it, change in the `configuration.js` the setting `features: { discovery: true, ` to `false`.

### Scope / Claims
This provider currently accepts both scope request over the `scope` url parameter of `groups` and `profile` (e.g: &scope=openid+groups+profile), or claims spefication over the `claims` url parameter.

In the `claims` url parameter case, this can be archieved by providing a UTF-8 encoded JSON in the url parameter, in compliance to the openid connect specification (https://openid.net/specs/openid-connect-core-1_0.html#ClaimsParameter - section 5.5).

So, requesting a claim of:
```
 {
   "id_token":
    {
     "groups": {"essential": true},
     "name": {"essential": true}
    }
  }
```
translates to setting the claims url parameter to `&claims=%7B%22id_token%22%3A%7B%22groups%22%3A%20%7B%22essential%22%3A%20true%7D%2C%22name%22%3A%20%7B%22essential%22%3A%20true%7D%7D%7D`

## Configuration
The `configuration.js` file contains the base configuration.
Some of this configurations can be overriten by environment variables (see `Environment` section), while other still  requires manual change of this file.

### Environment
* `DEBUG="beame:oidc-ad-provider:*"` - enables debug log
* `BEAME_CERT_FQDN` - certificate fqdn to use for signing the jwt (`mandatory`)
* `BEAME_ADDRESS` - address to use to run the node server (default http://localhost)
* `BEAME_PORT` - port to use to run the node server (default 3000)
* `BEAME_TIMEOUT` 

### Clients
OpenID Connect clients are defined in the `configuration.js` under `module.exports.clients = `. 
Currently there is no interface to add or remove clients from the outside since the current usage scope is restricted

`client_id`, `client_secret` and `redirect_uris` should be redefined and configured in the oidc client to match

### AD Groups map
Active directory groups map to beame groups is defined in the `configuration.js` under `module.exports.adGroupsMap =`. 
Each AD group can match to one or more beame groups. AD groups shouldn't be configured in duplicate.
When a user reaches the provider, all his AD groups will be mapped to the right beame groups. The final list shipped with the JWT token will be flatten and duplicates will be removed.
