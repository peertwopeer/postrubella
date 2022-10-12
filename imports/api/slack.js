import SlackWebhook from 'slack-webhook';
import { check }         from 'meteor/check';


if (!Meteor.isServer) return;

const {
  webhookUrl,
  username,
  channel,
} =  Meteor.settings.private.slack;


const slack = new SlackWebhook(webhookUrl, {
  defaults: {
    username,
    channel,
  },
});

Meteor.methods({

  sendToSlack(message) {
    check(message, String);
    slack.send(message)
      .then((res) => {
        // console.log(res)
      })
      .catch((err) => {
        console.error('sendToSlack', err, 'Message:', message);
      });
  },

});
