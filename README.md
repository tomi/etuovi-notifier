An Azure Function to check for new Etuovi emails in GMail and send links of apartments to Telegram

## Setup

1. Create .env file and fill in the values

```bash
cp .env-sample .env
```

- `TELEGRAM_BOT_TOKEN`: string (not base64 encoded) of [Telegram bot](https://core.telegram.org/bots) token.
- `TELEGRAM_BOT_CHANNEL`: string (not base64 encoded) of [Telegram channel](https://core.telegram.org/bots) ID.

    For group chats: invite bot to a channel, make the channel a super group, promote bot as admin (so they can post there), and run:

    ```
    curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates"
    ```

    There you can see the chat id of the group, that is the one needed.


- `CREDENTIALS`: base64 encoded object of GMail OAuth2 client secrets. See `credentials.json` in [https://developers.google.com/gmail/api/quickstart/nodejs](https://developers.google.com/gmail/api/quickstart/nodejs).

- `ACCESS_TOKEN`: base64 encoded object of GMail OAuth2 access and refresh token. See `token.json` in [https://developers.google.com/gmail/api/quickstart/nodejs](https://developers.google.com/gmail/api/quickstart/nodejs). Needed scopes are:

```json
[
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify"
]
```

- `GOOGLE_MAPS_KEY`: string (not base64 encoded) of Google Maps API key. You need to enable Directions API and add API Key credentials in Google Cloud Console. See https://developers.google.com/maps/documentation/directions/start


2. Edit the places ([places.ts](CheckForNewApartments/place.ts)) you are often traveling from your apartment. Could be your work via car, hobby via bicycle, etc. Waypoints can be added but please note that Google doesn't support them in public transit. The arrival time can be spcified for public transit (for example 9AM Monday).

3. Install the [Azure Functions Core Tools](https://github.com/Azure/azure-functions-core-tools)

4. Install dependencies

```bash
npm i
```

5. Create an email notification in https://www.etuovi.com

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
