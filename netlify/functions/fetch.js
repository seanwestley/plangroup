// netlify/functions/getEnvelopes.js
const docusign = require('docusign-esign');

exports.handler = async function (event, context) {
  try {
    // Your DocuSign Integration Info
    const integratorKey = process.env.DS_CLIENT_ID;
    const userId = process.env.DS_USER_ID; // GUID format
    const authServer = 'account.docusign.com';
    const privateKey = process.env.DS_PRIVATE_KEY.replace(/\\n/g, '\n');
    console.log('Private Key:', privateKey);

    const dsApi = new docusign.ApiClient();
    dsApi.setOAuthBasePath(authServer);

    // Generate JWT Token
    const results = await dsApi.requestJWTUserToken(
      integratorKey,
      userId,
      ['signature', 'impersonation'],
      privateKey,
      3600
    );

    const accessToken = results.body.access_token;

    // Get User Info
    const userInfo = await dsApi.getUserInfo(accessToken);
    const accountId = userInfo.accounts[0].accountId;
    const basePath = userInfo.accounts[0].baseUri + '/restapi';
    console.log(accountId);
    // Configure API Client
    dsApi.setBasePath(basePath);
    dsApi.addDefaultHeader('Authorization', 'Bearer ' + accessToken);

    const envelopesApi = new docusign.EnvelopesApi(dsApi);
 const response = await envelopesApi.listStatusChanges(accountId, {
  count: 1000, // Or remove it to use default (up to 100)
  include: 'recipients', // Optional: preload recipients
  // You can also add `status: 'any'` to ensure all are fetched
});
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(response.envelopes),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: error.message, stack: error.stack }),
    };
  }
};
