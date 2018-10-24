// $ AWS_ENV= AWS_REGION=us-east-1 iam-starter --role role-ops-devops --profile fpwdev --command ssm-starter --ssm-name /fpw/ --command node generateTestUsers.js

async function getTokens(phones) {
  let tokens = []
  const PhoneTokenService = require('./index')
  const phoneTokenService = new PhoneTokenService({
    tokenHashHmac: process.env.USERTOKEN_HASH_HMAC,
    s3bucket: 'forgotpw-usertokens-dev',
    defaultCountryCode: 'US'
  })

  for (let phone of phones) {
    const token = await phoneTokenService.getTokenFromPhone(phone)
    tokens.push({ phone, token })
  }
  return tokens
}

phones = [
  '6092734392',
  '6095551212',
  '6095551313',
  '6095551414'
]

getTokens(phones).then((tokens) => {
  for (let token of tokens) {
    console.log(`Token for ${token.phone}: ${token.token}`)
  }
})
