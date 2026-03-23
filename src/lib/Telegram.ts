import TelegramBot, {
  Message,
  SendMessageOptions,
} from 'node-telegram-bot-api';
import {
  TELEGRAM_API_KEY,
  CHAT_ID,
  BANKX_CHAT_ID,
} from '../config/env-vars.js';
import { roundDown } from '../utils/format.js';
import { BlockchainData } from '../types/index.js';

export class Telegram {
  private token: string;
  private chatId: string;
  private bankxChatId: string;
  private bot: TelegramBot;

  constructor() {
    const _token = TELEGRAM_API_KEY;
    const _chatId = CHAT_ID;
    const _bankxChatId = BANKX_CHAT_ID;
    if (!_token || !_chatId || !_bankxChatId) {
      console.error(
        'Please set TELEGRAM_API_KEY, CHAT_ID, and BANKX_CHAT_ID in your .env file',
      );
      process.exit(1);
    }

    this.token = _token;
    this.chatId = _chatId;
    this.bankxChatId = _bankxChatId;
    this.bot = new TelegramBot(this.token, { polling: false });
  }

  public bankXMsg(data: BlockchainData): string {
    const chains = [
      { key: 'eth', label: 'ETH' },
      { key: 'bsc', label: 'BNB' },
      { key: 'arbitrum', label: 'ARB' },
      { key: 'polygon', label: 'POL' },
      { key: 'optimism', label: 'OPT' },
      { key: 'avalanche', label: 'AVAX' },
      { key: 'base', label: 'BASE' },
      { key: 'pulsechain', label: 'PULSE' },
    ] as const;

    const sections = chains.map(({ key, label }) => {
      const xsdKey = `${key}XsdPrice` as keyof BlockchainData;
      const bankxKey = `${key}BankxPrice` as keyof BlockchainData;

      const xsd = roundDown(data[xsdKey], 4);
      const bankx = roundDown(data[bankxKey], 6);

      return `
<b>${label}</b>
<i>XSD</i>: <b>$${xsd}</b>
<i>BankX</i>: <b>$${bankx}</b>
`;
    });

    const msg = `
<b><a href="https://app.bankx.io/">BANKX PRICES</a></b>
  
<i>Silver/gram:</i> <b>$${roundDown(data.agGramPrice, 2)}</b>
${sections.join('')}
<b><a href="https://app.bankx.io/#/pricing">Pricing Charts</a></b> | <b><a href="https://t.me/BankXPrices">Daily Prices</a></b>
`;

    return msg;
  }

  public async sendMsg(
    message: string,
    useAltChat: boolean = false,
  ): Promise<Message | null> {
    try {
      const options: SendMessageOptions = {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };

      const targetChatId = useAltChat ? this.bankxChatId : this.chatId;

      const sentMessage = await this.bot.sendMessage(
        targetChatId,
        message,
        options,
      );
      return sentMessage;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      return null;
    }
  }

  public async deleteMsg(lastSentMessageId: number): Promise<boolean> {
    try {
      await this.bot.deleteMessage(this.chatId, lastSentMessageId - 1);
      return true;
    } catch (error) {
      console.error('Failed to delete Telegram message:', error);
      return false;
    }
  }
}
