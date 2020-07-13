const base64 = require("js-base64").Base64;

function assertEnvVar(name: string) {
  if (!process.env[name]) {
    throw new Error(`Missing ${name} env var`);
  }

  return process.env[name]!;
}

const googleCredentials = JSON.parse(base64.decode(assertEnvVar("CREDENTIALS")));
const googleToken = JSON.parse(base64.decode(assertEnvVar("ACCESS_TOKEN")));
const telegramBotToken = assertEnvVar("TELEGRAM_BOT_TOKEN");
const telegramBotChannel = assertEnvVar("TELEGRAM_BOT_CHANNEL");
const googleMapsKey = assertEnvVar("GOOGLE_MAPS_KEY");

export const config = {
  telegramBotToken,
  telegramBotChannel,
  googleCredentials,
  googleToken,
  googleMapsKey,
};
