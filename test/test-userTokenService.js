const chai = require('chai')
const assert = chai.assert;
const PhoneTokenService = require('../index')
const rewire = require('rewire')
const rewired = rewire('../index');
const convertPhoneToE164Format = rewired.__get__('convertPhoneToE164Format')
const lookupToken = rewired.__get__('lookupToken');
const createToken = rewired.__get__('createToken');

const config = {
  tokenHashHmac: 'unittestingsecret',
  s3bucket: 'forgotpw-usertokens-dev',
  s3prefixTokens: 'test-tokens/',
  s3prefixPhoneNumbers: 'test-e164/',
  defaultCountryCode: 'US'
}
const secret = 'unittestsecret'

describe('convertPhoneToE164Format', function () {
  it('should parse US number without calling code (+1) with US country code', function () {
    let e164 = convertPhoneToE164Format('6095551212', 'US')
    assert.equal(e164, '+16095551212')
  });
  it('should parse US number with calling code (1) with US country code', function () {
    let e164 = convertPhoneToE164Format('16095551212', 'US')
    assert.equal(e164, '+16095551212')
  });
  it('should parse US number with calling code (+1) with US country code', function () {
    let e164 = convertPhoneToE164Format('+16095551212', 'US')
    assert.equal(e164, '+16095551212')
  });
  it('should parse US number with calling code (+1) with foreign country code', function () {
    let e164 = convertPhoneToE164Format('+16095551212', 'RU')
    assert.equal(e164, '+16095551212')
  });
  it('should parse US number with dashes with US country code', function () {
    let e164 = convertPhoneToE164Format('609-555-1212', 'US')
    assert.equal(e164, '+16095551212')
  });
  it('should parse US number with spaces with US country code', function () {
    let e164 = convertPhoneToE164Format('  609 555 1212  ', 'US')
    assert.equal(e164, '+16095551212')
  });
  it('should parse RU number without calling code, with RU country code provided', function () {
    let e164 = convertPhoneToE164Format('800 555 35 35', 'RU')
    assert.equal(e164, '+78005553535')
  });
  it('should parse RU number with calling code without RU country code provided', function () {
    let e164 = convertPhoneToE164Format('+7 800 555 35 35', 'US')
    assert.equal(e164, '+78005553535')
  });
});

describe('createToken', function () {
  it('should create the same token from varios formatted phone numbers (same country code)', async function () {
    const phoneNumbers = [
      '+1-212-555-1212',
      '212-555-1212',
      '+12125551212',
      '1-212-555-1212',
      '+1 212 555-1212',
      ' 212 555  1212  ',
      '(212)555-1212'
    ]
    const token = createToken(
      secret,
      '212-555-1212',
      'US')
    for (const phoneNumber of phoneNumbers) {
      assert.equal(token, createToken(
        secret,
        phoneNumber,
        'US')
      )
    }
  });
});

describe('lookupToken', function () {
  it('should return null when looking up a non-existant token', async function () {
    let token = await lookupToken(
      config.s3bucket,
      config.s3prefixPhoneNumbers,
      'INVALIDfjkdsaljfkslj')
    assert.equal(token, null)
  });
});

describe('getTokenFromPhone', function () {
  this.timeout(10000)
  it('should return a token from a new phone number', async function () {
    const phoneTokenService = new PhoneTokenService(config)
    const phone = `212-555-${Math.floor(1000 + Math.random() * 9000)}`
    let token = await phoneTokenService.getTokenFromPhone(phone)
    assert.isNotNull(token)
    assert.isTrue(token.startsWith('UT'))
    assert.isTrue(token.length > 20)
  });
});

describe('getPhoneFromToken', function () {
  this.timeout(10000)
  it('should return a phone from a token', async function () {
    const phoneTokenService = new PhoneTokenService(config)
    // getTokenFromPhone will create the token if it doesn't already exist
    let token = await phoneTokenService.getTokenFromPhone('212-555-1212')

    // now try to retrieve the phone with the token
    let phone = await phoneTokenService.getPhoneFromToken(token)
    assert.isNotNull(phone)
    assert.equal(phone, '+12125551212')
  });
});

describe('doesTokenExistForPhone', function () {
  this.timeout(10000)
  it('should return false for an unknown phone number', async function () {
    const phoneTokenService = new PhoneTokenService(config)
    const exists = await phoneTokenService.doesTokenExistForPhone('212-123-7201')
    assert.equal(exists, false)
  });
  it('should return true for a known phone number', async function () {
    const phoneTokenService = new PhoneTokenService(config)
    const phone = '212-555-1212'
    // getTokenFromPhone will create the token if it doesn't already exist
    const token = await phoneTokenService.getTokenFromPhone(phone)
    const exists = await phoneTokenService.doesTokenExistForPhone(phone)
    assert.equal(exists, true)
  });
});

describe('getTokenFromAlexaUserId', function () {
  this.timeout(10000)
  it('should return a token from an alexa user id that has a token set', async function () {
    const phoneTokenService = new PhoneTokenService(config)
    // getTokenFromPhone will create the token if it doesn't already exist
    const phone = '212-555-1212'
    // getTokenFromPhone will create the token if it doesn't already exist
    const token = await phoneTokenService.getTokenFromPhone(phone)
    await phoneTokenService.setAlexaUserIdFromToken(token, 'testalexaid')
    // now try to read the token back from the alexa id
    let retrievedToken = await phoneTokenService.getTokenFromAlexaUserId('testalexaid')
    assert.isNotNull(retrievedToken)
    assert.equal(retrievedToken, token)
  });
  it('should return empty string if alexa user id does not exist on s3', async function () {
    const phoneTokenService = new PhoneTokenService(config)
    let retrievedToken = await phoneTokenService.getTokenFromAlexaUserId('makesurethisdoesnotexist')
    assert.isNotNull(retrievedToken)
    assert.equal(retrievedToken, '')
  });
});
