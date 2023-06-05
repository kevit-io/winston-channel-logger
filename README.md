# README

This repository contains a Winston Channel Logger for logging messages to various platforms such as Microsoft Teams, Slack, and Discord. The module utilizes incoming Webhooks and Platform APIs to send messages.

## Installation

To install the module into your project, you can use npm or yarn:

```bash
npm install @kevit/winston-channel-logger
```

or

```bash
yarn add @kevit/winston-channel-logger
```

## Usage

To use the custom transport module, follow these steps:

1. Import it into your code as:

```javascript
import { WinstonChannelLogger } from '@kevit/winston-channel-logger';
```

2. Initialize the object of `WinstonChannelLogger` as:
```javascript
const winstonChannelLogger = new WinstonChannelLogger({ 
  format: format.uncolorize(),
  level:'log_level',
  platforms: [{
    platformName: 'ms-teams',
    webhookUrl: '<teams-webhook-url>',
  },
    {
      platformName: 'slack',
      token: '<slack-token>',
      channelId: '<slack-channel-id>',
    },
    {
      platformName: 'discord',
      webhookUrl: '<discord-webhook-url>',
    }],
});
```
3. Finally, attach this custom logger in `transports` array of `createLogger` For ex:
```javascript
const logger = createLogger({
  transports: [new transports.Console({  level:'silly'}), winstonChannelLogger],
});
```

In the above configuration one or more channels can be configured by passing channel specific argument Channel specific configuration.
Configurations can be made as follows:

### Microsoft Teams

- Value for `platformName` will be `ms-teams`.
- For getting `teams-webhook-url` , it can be generated as mentioned in the [documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet#create-incoming-webhooks-1).

### Slack

- Value for `platformName` will be `slack`.
- All the messages will be dumped as threads of the message for a given date.
- A message will be created with the text as `Logs for Date: dd-MM-yyyy`. This helps to organise the messages grouped by the Date they are sent.
- Following configurations will be needed to enable this:
  - Create a Slack App referring [this](https://api.slack.com/apps?new_app=1). Choose to build from scratch and select the desired workspace.
  - For getting `slack-token`:
    - After the app is created, from the Left Navigation Menu, goto `OAuth and Permissions` tab
    - Under the Scopes section, add `channels:read`, `channels:history`, `chat:write` permissions.
    - Once done, from the same tab, from the `OAuth Tokens` section generate & copy `Bot User OAuth Token` and install/reinstall it to the workspace. Select the needful `public` channel.
    - Use this generated token as `slack-token` in the configuration of WinstonChannelLogger's object.
  - For getting `slack-channel-id`:
    - Go to Slack App, from the list of channels, right click on the Public channel for which logger is enabled (same that is allowed in previous step), and select `View channel details`.
    - Scroll down in popup to get the Channel Id something as shown below:
    ![Channel Id](asset/Channel%20Id.png)

### Discord

- Value for `platformName` will be `discord`.
- For getting `discord-webhook-url` , it can be generated as mentioned in the [documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet#create-incoming-webhooks-1).


## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or a pull request in this repository.

## License

This project is licensed under the [GNU GENERAL PUBLIC LICENSE](LICENSE).
