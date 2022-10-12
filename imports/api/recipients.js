// npm
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

// mongo
export const Recipients = new Mongo.Collection('recipients');

// server: publish
if (Meteor.isServer) {
  Meteor.publish('recipients',() => {
    const user = Meteor.user();

    if (!user) return [];

    const { clientId } = user.profile;

    return Recipients.find({ clientId }, {
      sort: { recipientName: 1 },
    });
  });

  Meteor.publish('recipients.app', () =>  {
    const user = Meteor.user();

    if (!user) return [];

    const { clientId } = user.profile;

    return Recipients.find({ clientId }, {
            fields: { recipientName: 1 },
            sort: { createdAt: -1 },
            limit: 1000,
          });

  });
  Meteor.publish('recipients.list.dropdowns',(limit, findQuery) => {
    check(limit, Number);
    check(findQuery, Object);
    //authentication
    const user = Meteor.user();
    if (!user) throw new Meteor.Error('not authorized');
    findQuery.clientId = Meteor.user().profile.clientId;
    return Recipients.find(findQuery, {
      sort: {
        recipientName: 1,
      },
      fields: {recipientName:1},
      limit: limit
    });
  });

  Recipients.allow({
    insert() {
      return true;
    },
    update() {
      return true;
    },
    remove() {
      return true;
    },
  });
}
// methods
Meteor.methods({
  'recipients.insert': function (recipientName, clientId, outboundRecipient) {
    check([recipientName, clientId, outboundRecipient], String);
    // Make sure the user is logged in before inserting a recipient
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    Recipients.insert({
      recipientName,
      outboundRecipient,
      createdAt: new Date(),
      owner: this.userId,
      username: Meteor.users.findOne(this.userId).username,
      clientId,
    });
  },

  'recipients.update': function (_id, recipientName) {
    check([_id,recipientName], String);
    // Make sure the user is logged in before inserting a carrier
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const recipientId = Recipients.findOne(_id);

    Recipients.update(recipientId, {
      $set: {
        recipientName,
        updatedAt: new Date(),
      },
    });
  },

  'recipients.checklocation': function updateLocation(recipientName,identifyData,flag=0) {
    check(recipientName, String);
    check(identifyData, Object);
    check(flag, Number);
    
    const clientId= identifyData.clientId;
 
    if (Recipients.findOne({ recipientName, "clientId": clientId })) return;

    if(flag==1){
      Recipients.insert({
        ...identifyData,
        recipientName,
        outboundRecipient: true,
      });
    }
    else{
      Recipients.insert({
        ...identifyData,
        recipientName,
      });
    }

  },
  'recipients.uploadData': function uploadRecipientsData(recipientData,clientId){
    check(recipientData, Array);
    // Make sure the user is logged in before inserting a recipient
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    recipientData.forEach((recipient)=>{
      key = Object.keys(recipient)
      recipient['recipientName'] = recipient[key]; // Assign new key 
      delete recipient[key]; // Delete old key 
      if (Recipients.findOne({ recipientName: recipient.recipientName, clientId: clientId })) return;
      Recipients.insert({
      recipientName: recipient.recipientName,
      createdAt: new Date(),
      owner: this.userId,
      username: Meteor.users.findOne(this.userId).username,
      clientId,
    });
    })
  },
  // delete recipients
  'recipients.remove': function (recipientIds) {
    check(recipientIds, Array);
    if (!Meteor.user()) throw new Meteor.Error('not authorized to perform this action');
    Recipients.remove({ _id: { $in: recipientIds} });
    return true;
  },
  // copy recipients from one to another
  "recipients.copyRecipients": () => {
    const date = new Date();

    const client = {
      id: "Pv7XYqN9MNKjqXm4T",
      name: "Battersea Concierge",
      owner: "q3phB4kJaADcZnDiz",
      username: "pp1concierge",
    };

    const powerStationRecipients = Recipients.find(
      { clientId: "Qb8spSTbQRrLu2xd3" }, // source client id
      {
        fields: { recipientName: 1 },
      }
    ).fetch();

    let total = powerStationRecipients.length;
    let successCount = 0;

    powerStationRecipients.forEach((recipient) => {
      Recipients.insert({
        recipientName: recipient.recipientName,
        username: client.username,
        owner: client.owner,
        clientId: client.id,
        createdAt: date,
        updatedAt: date,
      });
      successCount++;
    });

    return { total, successCount };
  },
});
