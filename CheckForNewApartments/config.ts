const base64 = require("js-base64").Base64;

function assertEnvVar(name: string) {
  if (!process.env[name]) {
    throw new Error(`Missing ${name} env var`);
  }

  return process.env[name]!;
}

const telegramBotToken = JSON.parse(base64.decode(assertEnvVar("BOT_TOKEN")));
const credentials = JSON.parse(base64.decode(assertEnvVar("CREDENTIALS")));
const token = JSON.parse(base64.decode(assertEnvVar("ACCESS_TOKEN")));

export const config = {
  telegramBotToken,
  credentials,
  token
};
