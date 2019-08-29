import axios from "axios";

export type TelegramClient = ReturnType<typeof createClient>;

export const createClient = (token: string) => ({
  sendMsg: async (chatId: string, msg: string) =>
    await axios({
      method: "post",
      url: `https://api.telegram.org/bot${token}/sendMessage`,
      params: {
        chat_id: chatId,
        text: msg
      }
    })
});
