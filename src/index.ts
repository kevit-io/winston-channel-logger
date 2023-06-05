import axios from 'axios';
import * as Transport from 'winston-transport';

const slackObject = {
  messageId: null,
  date: null,
};
let lastDiscordMessageAt = Date.now();

const sendMessageToTeams = async (logType, message, webhookUrl, errorStack) => {
  try {
    let themeColor = '';
    switch (logType) {
      case 'error':
        themeColor = 'AA0000';
        break;
      case 'warn':
        themeColor = 'AA5500';
        break;
      case 'info':
        themeColor = '00AA00';
        break;
      case 'http':
        themeColor = '00AA00';
        break;
      case 'verbose':
        themeColor = '00AAAA';
        break;
      case 'debug':
        themeColor = '0000AA';
        break;
      case 'silly':
        themeColor = 'AA00AA';
        break;
      default:
        themeColor = '00AA00';
        break;
    }
    if (errorStack) message += '\n\n > ' + errorStack.toString();
    await axios.post(
      webhookUrl,
      {
        text: '```' + logType + '``` at ' + new Date().toISOString(),
        themeColor,
        sections: [
          {
            activitySubtitle: message,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          charset: 'UTF-8',
        },
      },
    );
  } catch (e) {
    console.log('Error sending log to Teams');
  }
};

const sleep = async (timeInMs) => new Promise((resolve, reject) => {
  setTimeout(() => resolve(null), timeInMs);
});

const sendMessageToDiscord = async (
  logType,
  message,
  webhookUrl,
  errorStack,
) => {
  try {
    lastDiscordMessageAt += 1000;
    if (lastDiscordMessageAt - Date.now() > 0)
      await sleep(lastDiscordMessageAt - Date.now());
    // }
    message =
      '`' + logType + '` at ' + new Date().toISOString() + '\n' + message;
    if (errorStack) message += '\n\n ``` ' + errorStack.toString() + '``` ';
    await axios.post(
      webhookUrl,
      {
        content: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          charset: 'UTF-8',
        },
      },
    );
  } catch (e) {
    console.log('Error sending log to Discord');
  }
};

const fetchSlackChatHistory = async (xoxbToken, channelId) => {
  return axios.get('https://slack.com/api/conversations.history', {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${xoxbToken}`,
    },
    params: {
      channel: channelId,
      inclusive: true,
      limit: 1,
    },
  });
};

const postDateMessageToSlack = async (xoxbToken, channelId, message) => {
  return axios.post(
    'https://slack.com/api/chat.postMessage',
    {
      channel: channelId,
      text: message,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${xoxbToken}`,
      },
    },
  );
};

const addLogToThreadToSlack = async (
  xoxbToken,
  channelId,
  parentMessageId,
  message,
) => {
  return axios.post(
    'https://slack.com/api/chat.postMessage',
    {
      channel: channelId,
      thread_ts: parentMessageId,
      text: message,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${xoxbToken}`,
      },
    },
  );
};

const sendMessageToSlack = async (
  logType,
  message,
  xoxbToken,
  channelId,
  errorStack,
) => {
  try {
    const dt = new Date();
    const dtString = `${dt.getFullYear()}-${(dt.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`;
    if (!slackObject || !slackObject.date || !slackObject.messageId) {
      const { data: channelHistory } = await fetchSlackChatHistory(
        xoxbToken,
        channelId,
      );
      const { messages } = channelHistory;
      let dateMessagePresent = false;
      if (messages && messages.length > 0) {
        if (
          messages[0] &&
          messages[0].text &&
          messages[0].text === `Logs for Date: \`${dtString}\``
        ) {
          dateMessagePresent = true;
          slackObject.messageId = messages[0].ts;
          slackObject.date = dtString;
        }
      }
      if (!dateMessagePresent) {
        const { data: messageResponse } = await postDateMessageToSlack(
          xoxbToken,
          channelId,
          `Logs for Date: \`${dtString}\``,
        );
        slackObject.messageId = messageResponse.ts;
        slackObject.date = dtString;
      }
    }
    if (errorStack) message += '\n ```' + errorStack + '```';
    await addLogToThreadToSlack(
      xoxbToken,
      channelId,
      slackObject.messageId,
      message,
    );
  } catch (e) {
    console.log('Error sending log to Slack');
  }
};

export class WinstonChannelLogger extends Transport {
  platforms: [
    {
      webhookUrl: string;
      token: string;
      channelId: string;
      platformName: string;
    },
  ];

  constructor(opts) {
    super(opts);
    this.platforms = opts.platforms;
  }

  async log(info, callback) {
    for (const platform of this.platforms) {
      switch (platform.platformName) {
        case 'ms-teams':
          sendMessageToTeams(
            info.level,
            info.message,
            platform.webhookUrl,
            info.stack,
          );
          break;
        case 'slack':
          sendMessageToSlack(
            info.level,
            info.message,
            platform.token,
            platform.channelId,
            info.stack,
          );
          break;
        case 'discord':
          sendMessageToDiscord(
            info.level,
            info.message,
            platform.webhookUrl,
            info.stack,
          );
          break;
      }
    }
    callback();
  }
}
