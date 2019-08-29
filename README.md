An Azure Function to check for new Etuovi emails in GMail and send links of apartments to Telegram

## Setup

1. Create .env file and fill in the values

```bash
cp .env-sample .env
```

- `BOT_TOKEN`: base64 encoded object of [Telegram bot](https://core.telegram.org/bots) config:

```json
{
  "token": "", // Access token for the bot
  "channel": "" // Channel id where messages are sent
}
```

- `CREDENTIALS`: base64 encoded object of GMail OAuth2 client secrets. See `credentials.json` in [https://developers.google.com/gmail/api/quickstart/nodejs](https://developers.google.com/gmail/api/quickstart/nodejs).

- `ACCESS_TOKEN`: base64 encoded object of GMail OAuth2 access and refresh token. See `token.json` in [https://developers.google.com/gmail/api/quickstart/nodejs](https://developers.google.com/gmail/api/quickstart/nodejs). Needed scopes are:

```json
[
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify"
]
```

2. Install the [Azure Functions Core Tools](https://github.com/Azure/azure-functions-core-tools)

3. Install dependencies

```bash
npm i
```

4. Create an email notification in https://www.etuovi.com

## Run locally

```bash
npx ts-node ./scripts/checkForApartments.ts
```

## Deploy to Azure

1. Create an Azure Function app and deploy the app there (log in first to `az` cli):

```bash
npm i
npm run build:production
func azure functionapp publish <appname>
```

2. Configure the same env variables in `.env` to the function app
