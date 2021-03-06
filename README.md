# PhoneTokenService

A library for storing and retrieving of pseudo anonymised tokens from phone numbers, supporting standardized E164 phone number normalized formatting and S3 backed storage for the lookup data.

## Installation

```shell
npm install --save phone-token-service
```

## Usage

### Get a Token from a Phone Number

Note that if a token doesn't yet exist it will be created by calling getTokenFromPhone.

```javascript
const PhoneTokenService = require('phone-token-service');
const phoneTokenService = new PhoneTokenService({
  // salt for hashing algorithm 
  tokenHashHmac: 'mysecret',
  // s3 bucket for storing the mapping relationship
  s3bucket: 'forgotpw-usertokens-dev',
  // retrieve country code from ip address via https://ipapi.co/country/
  defaultCountryCode: 'US'
});
const phone = '212-555-1212';
const token = await phoneTokenService.getTokenFromPhone(phone);
console.log(`Token for ${phone} is ${token}`);
```

### Get a Phone Number from a Token

```javascript
const PhoneTokenService = require('phone-token-service');
const phoneTokenService = new PhoneTokenService({
  tokenHashHmac: 'mysecret',
  s3bucket: 'forgotpw-usertokens-dev',
  defaultCountryCode: 'US'
});
const userToken = 'UT39jsklsjsu2389u3832jljklcjfewoizlz';
const phone = await phoneTokenService.getPhoneFromToken(userToken);
console.log(`Phone for ${token} is ${phone}`);
```

### Associate an Alexa User ID from a Token

If using with Amazon Alexa, this provides a way to associate a token with an Alexa User ID so you can later retrieve the token from the Alexa User Id.

```javascript
const PhoneTokenService = require('phone-token-service');
const phoneTokenService = new PhoneTokenService({
  tokenHashHmac: 'mysecret',
  s3bucket: 'forgotpw-usertokens-dev',
  defaultCountryCode: 'US'
});
const userToken = 'UT39jsklsjsu2389u3832jljklcjfewoizlz';
const alexaUserId = 'testing'; // Get this from session.user.userId in the Alexa response

// Set Alexa User ID and token relationship
await phoneTokenService.setAlexaUserIdFromToken(userToken, alexaUserId);

// Get a Token from an Alexa User ID
const alexaUserId = 'testing'; // Get this from session.user.userId in the Alexa response
const userToken = await phoneTokenService.getTokenFromAlexaUserId(alexaUserId);
```

## Testing

```shell
# pip install iam-starter
npm install
iam-starter \
  --role my-iam-role-with-access \
  --profile profile-with-access-to-assume-role \
  --command npm test 
```

## License

MIT

See [LICENSE](LICENSE.txt) to see the full text.
