import { google, gmail_v1 } from "googleapis";
import { GaxiosResponse } from "gaxios";
var base64 = require("js-base64").Base64;
import { config } from "./config";
import { ILogger } from "./models";
import { createClient } from "./telegram";
import * as cheerio from "cheerio";
import { URL } from "url";

export async function run(logger: ILogger) {
  const { telegramBotToken, credentials, token } = config;

  const telegramClient = createClient(telegramBotToken.token);

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  oAuth2Client.setCredentials(token);
  await getUnread(oAuth2Client);

  async function getUnread(auth) {
    const gmail = google.gmail({ version: "v1", auth });
    const res = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["UNREAD"]
    });

    if (!res.data.messages || res.data.messages.length === 0) {
      logger.info("No unread messages");
      return;
    }

    let msgs = await Promise.all<any>(
      res.data.messages.map(listedMsg => {
        const msg = gmail.users.messages.get({
          userId: "me",
          id: listedMsg.id
        });

        return msg;
      })
    );

    const etuoviMsgs = findEtuoviMessages(msgs);
    if (etuoviMsgs.length === 0) {
      logger.info("No unread etuovi messages");
    }

    const urls = etuoviMsgs
      .map(parsePayload)
      .map(findTargetLinksFromEmail)
      .reduce((all, curr) => all.concat(curr), []);

    if (urls.length > 0) {
      logger.info("Sending new targets", urls.join(", "));
      await Promise.all(
        urls.map(url => telegramClient.sendMsg(telegramBotToken.channel, url))
      );
    }

    await markAsRead(gmail, msgs.map(m => m.data.id));
  }

  function markAsRead(gmail: gmail_v1.Gmail, msgIds: string[]) {
    logger.info("Marking as read", msgIds.join(", "));

    return gmail.users.messages.batchModify({
      userId: "me",
      requestBody: {
        ids: msgIds,
        removeLabelIds: ["UNREAD"]
      }
    });
  }

  function findEtuoviMessages(msgs: GaxiosResponse<gmail_v1.Schema$Message>[]) {
    return msgs.filter(msg => {
      const fromHeader = msg!.data!.payload!.headers!.find(
        h => h.name === "From"
      );

      return fromHeader && fromHeader.value!.includes("@etuovi.com");
    });
  }

  function parsePayload(msg: GaxiosResponse<gmail_v1.Schema$Message>) {
    const htmlPart = msg!.data!.payload!.parts!.find(
      p => p.mimeType === "text/html"
    );
    if (!htmlPart) {
      return "";
    }

    return base64.decode(
      htmlPart.body!.data!.replace(/-/g, "+").replace(/_/g, "/")
    );
  }
}

function findTargetLinksFromEmail(html: string): string[] {
  const $ = cheerio.load(html);

  const urls = $("a")
    .map((i, el) => $(el).attr("href"))
    .toArray()
    .filter((url: string) => url.startsWith("https://www.etuovi.com/kohde/"))
    .map((url: string) => {
      const u = new URL(url);

      return u.origin + u.pathname;
    });

  return Array.from(new Set(urls));
}
