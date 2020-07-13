import axios from "axios";

export type TelegramClient = ReturnType<typeof createClient>;

export const createClient = (token: string) => ({
  sendMsg: async (chatId: string, msg: string, replyToId?: string) =>
    await axios({
      method: "post",
      url: `https://api.telegram.org/bot${token}/sendMessage`,
      params: {
        chat_id: chatId,
        // Using HTML mode since MarkdownV2 required espace chars for everything:
        //   Bad Request: can\'t parse entities: Character \'.\' is reserved and must
        //   be escaped with the preceding \'\\\''"
        // https://core.telegram.org/bots/api#html-style
        parse_mode: 'HTML',
        text: msg,
        reply_to_message_id: replyToId,
      }
    })
});
