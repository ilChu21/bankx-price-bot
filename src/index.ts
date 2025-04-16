import { Viem } from './lib/Viem.js';
import { Telegram } from './lib/Telegram.js';
import { isDayAt, retryOperation } from './utils/misc.js';

export const handler = async (event: any) => {
  try {
    const viem = new Viem();
    const telegram = new Telegram();

    const data = await viem.getBlockchainData();
    const bankXMessage = telegram.bankXMsg(data);

    if (isDayAt(3, 19, 0o0)) {
      await telegram.sendMsg(bankXMessage, true);
    }

    const sentMsg = await telegram.sendMsg(bankXMessage);
    if (sentMsg && sentMsg.message_id) {
      const lastSentMessageId = sentMsg.message_id;
      await retryOperation(() => telegram.deleteMsg(lastSentMessageId), 5);
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify('BankX Telegram message sent.'),
    };
    return response;
  } catch (error) {
    console.error('Error sending BankX messages:', error);
  }
};
