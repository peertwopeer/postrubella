import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

const outboundEmailLogs = new Mongo.Collection('outboundEmailLogs');

export default outboundEmailLogs;

if (Meteor.isServer) {
  //publications
  Meteor.publish('outboundEmailLogs.admin', () => {
    const user = Meteor.user();

    if (!user) return console.error('user not found');
    if (!Roles.userIsInRole(user._id, ['super-admin'])) return console.error('not super-admin');

    return outboundEmailLogs.find({}, {
      sort: {
        createdAt: -1,
      },
    });
  });


  // methods
  Meteor.methods({

    'outboundEmailLogs.insert': function insertOutboundEmailLogs(to,subject,body) {
      check([to, subject, body], [String]);
      
      outboundEmailLogs.insert({
        to,
        subject,
        body,
        createdAt: new Date()
      });
    },

  });
}
