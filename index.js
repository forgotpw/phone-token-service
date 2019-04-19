const AWS = require('aws-sdk');
const logger = require('./logger')
const libphonenumber = require('libphonenumber-js')
const crypto = require('crypto');

class PhoneTokenService {
  constructor(config) {
    this.tokenHashHmac = config.tokenHashHmac
    this.defaultCountryCode = config.defaultCountryCode || 'US'
    this.s3bucket = config.s3bucket
    this.s3prefixTokens = config.s3prefixTokens || 'tokens/'
    this.s3prefixPhoneNumbers = config.s3prefixPhoneNumbers || 'e164/'
    if (!this.s3prefixTokens.endsWith('/'))
      this.s3prefixTokens += '/'
    if (!this.s3prefixPhoneNumbers.endsWith('/'))
      this.s3prefixPhoneNumbers += '/'
  }

  // checks if a token alrady exists for the given phone.  this is needed because
  // the first call to getTokenFromPhone stores a token for that phone, so if you
  // want to know if it's the first time this phone has ever been used you will
  // need to call this first
  async doesTokenExistForPhone(phone) {
    const e164 = convertPhoneToE164Format(phone, this.defaultCountryCode)
    let token = await lookupToken(this.s3bucket, this.s3prefixPhoneNumbers, e164)
    if (token == null) {
      logger.debug(`No token exists for: ${phone}`)
      return false;
    } else {
      logger.debug(`Token exists for: ${phone}`)
      return true;
    }
  }

  // phone can be raw, will be converted to E164 format
  // will create (and persist) a token on s3 if one doesn't already exist
  async getTokenFromPhone(phone) {
    const e164 = convertPhoneToE164Format(phone, this.defaultCountryCode)
    let token = await lookupToken(this.s3bucket, this.s3prefixPhoneNumbers, e164)
    if (token != null) {
      logger.debug(`Retrieved existing user token from raw phone: ${token}`)
    } else {
      token = createToken(this.tokenHashHmac, phone, this.defaultCountryCode)
      logger.debug(`Storing token for ${token} s3://${this.s3bucket}/(key masked)`)
      await putS3(this.s3bucket, `${this.s3prefixTokens}${token}`, e164)
      logger.debug(`Storing e164 for ${token} s3://${this.s3bucket}/(key masked)`)
      await putS3(this.s3bucket, `${this.s3prefixPhoneNumbers}${e164.replace('+', 'P')}`, token)
    }
    return token
  }

  // will return E164 formatted phone from token
  async getPhoneFromToken(token) {
    let data = null
    const s3key = this.s3prefixTokens + token
    try {
      const s3 = new AWS.S3()
      data = await s3.getObject({
        Bucket: this.s3bucket,
        Key: s3key
      }).promise()
    }
    catch (err) {
      if (err.code == 'NoSuchKey') {
        let msg = `Tried looking up phone for a non-existent user token ${s3key}`
        logger.error(msg)
        throw err
      } else {
        let msg = `Error reading user token at s3://${this.s3bucket}/${s3key}: ${err}`
        logger.error(msg)
        throw err
      }
    }
    logger.debug(`Retrieved user token at s3://${this.s3bucket}/${s3key}`)
    return data.Body.toString()
  }

}

//
// private functions
//

function convertPhoneToE164Format(phone, defaultCountryCode) {
  try {
    const phoneNumber = libphonenumber.parsePhoneNumber(phone, defaultCountryCode)
    return phoneNumber.number
  } catch (err) {
    let msg = `Error converting '${phone}' to E164 format: ${err}`
    logger.error(msg)
    throw new Error(msg)
  }
}

function createToken(secret, phone, defaultCountryCode) {
  const e164 = convertPhoneToE164Format(phone.trim(), defaultCountryCode)
  const hash = crypto.createHmac('sha256', secret)
                    .update(e164)
                    .digest('hex')
  const token = `UT${hash}`
  return token
}

async function lookupToken(bucket, s3prefix, e164) {
  let data = null
  // plus symbol on s3 may cause issues
  const s3key = s3prefix + e164.replace('+', 'P')
  try {
    const s3 = new AWS.S3()
    data = await s3.getObject({
      Bucket: bucket,
      Key: s3key
    }).promise()
  }
  catch (err) {
    if (err.code == 'NoSuchKey') {
      return null
    } else {
      let msg = `Error reading user token at s3://${bucket}/${s3key}: ${err}`
      logger.error(msg)
      throw err
    }
  }
  logger.debug(`Successfully retrieved user token from e164`)
  return data.Body.toString()
}

async function putS3(bucket, s3key, body) {
  try {
    const s3 = new AWS.S3()
    let resp = await s3.putObject({
      Bucket: bucket,
      Key: s3key,
      ServerSideEncryption: 'AES256',
      Body: body,
      ContentType: 'text/plain'
    }).promise()
  }
  catch (err) {
    logger.error(`Error updating s3://${bucket}/(key masked):`, err)
    throw err
  }
  logger.info(`Successfully updated ${body.length} chars to s3://${bucket}/(key masked)`)
}

module.exports = PhoneTokenService
