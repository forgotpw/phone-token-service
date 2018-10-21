# PhoneTokenService

A library for storing and retrieving of pseudo anonymised tokens from phone numbers, supporting standardized E164 phone number normalized formatting and S3 backed storage for the lookup data.

## Installation

```shell
npm install --save phone-token-service
```

## Usage

### Get a Token from a Phone Number

```javascript
const PhoneTokenService = require('phone-token-service')
const phoneTokenService = new PhoneTokenService({
  // salt for hashing algorithm 
  tokenHashHmac: 'mysecret',
  // s3 bucket for storing the mapping relationship
  s3bucket: 'forgotpw-usertokens-dev',
  // retrieve country code from ip address via https://ipapi.co/country/
  defaultCountryCode: 'US'
})
const phone = '212-555-1212'
const token = await phoneTokenService.getTokenFromPhone(phone)
```

### Get a Phone Number from a Token

```javascript
const PhoneTokenService = require('phone-token-service')
const phoneTokenService = new PhoneTokenService({
  // salt for hashing algorithm 
  tokenHashHmac: 'mysecret',
  // s3 bucket for storing the mapping relationship
  s3bucket: 'forgotpw-usertokens-dev',
  // retrieve country code from ip address via https://ipapi.co/country/
  defaultCountryCode: 'US'
})
const userToken = 'UT39jsklsjsu2389u3832jljklcjfewoizlz'
const phone = await phoneTokenService.getPhoneFromToken(userToken)
```

## Testing

```shell
$ pip install iam-starter
$ iam-starter --role role-ops-devops --profile fpwdev --command npm test 
```

## License

MIT

See [LICENSE](LICENSE.txt) to see the full text.
