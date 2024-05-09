'use strict';

const ClientOAuth2 = require('client-oauth2');
const logger = require('@sap/approuter/lib/utils/logger').getLogger('/plc/xsjs/plcExtensions');
const tracer = require('@sap/approuter/lib/utils/logger').getTracer(__filename);
const xsenv = require('@sap/xsenv');

xsenv.loadEnv();
var uaaService = xsenv.getServices({ uaa: { tag: 'xsuaa' } }).uaa;

const clientCredentialAuth = new ClientOAuth2({
  clientId: uaaService.clientid,
  clientSecret: uaaService.clientsecret,
  accessTokenUri: uaaService.url + '/oauth/token'
});

const token = {
  expires: null,
  value: null
};

const MIN_VALIDITY_SECONDS = 10; // number of seconds for which the token is still valid
const MIN_VALIDITY_MILLIS = MIN_VALIDITY_SECONDS * 1000;

const continueProcessing = (req, res, next) => {
  var userId = (typeof req.user !== 'undefined') ? req.user['id'] : 'Unknown';
  req.headers['x-plc-user-id'] = userId;
  req.headers['Authorization'] = "Bearer " + token.value;
  tracer.debug('x-plc-user-id: ', userId);
  next();
};

const isTokenValid = () => {
  tracer.debug('validating token');
  if (token.expires == null) {
    tracer.debug('token is not valid: expires is null');
    return false;
  }
  const deltaTime = token.expires - Date.now();
  tracer.debug('token deltaTime: %d, MIN_VALIDITY_MILLIS: %d', deltaTime, MIN_VALIDITY_MILLIS);
  return deltaTime >= MIN_VALIDITY_MILLIS;
};

logger.info('defining the plc extensions handler');
module.exports = {
  insertMiddleware: {
    beforeRequestHandler: [
      {
        path: "/plcExtensions",
        handler: function (req, res, next) {
          tracer.debug('started processing extension');

          if (!isTokenValid()) {
            clientCredentialAuth.credentials.getToken()
              .then(
                (user) => {
                  tracer.debug('got a valid token - saving and using it');
                  token.expires = user.expires.getTime();
                  token.value = user.accessToken;
                  continueProcessing(req, res, next);
                },
                (err) => {
                  tracer.error('could not get token: %s', JSON.stringify(err));
                  res.end('Request failed - could not retrieve token.');
                }
              );
            return;
          }
          tracer.debug('saved token is valid - using it');
          continueProcessing(req, res, next);
        }
      }
    ]
  }
};
