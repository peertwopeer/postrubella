import { Meteor }   from    'meteor/meteor';
import { Mongo }    from    'meteor/mongo';
import { check }    from    'meteor/check';


export const Senders = new Mongo.Collection('senders');

// server: publish
if (Meteor.isServer) {
  Meteor.publish('senders', () => {
    const user = Meteor.user();

    if (!user) return;

    const { clientId } = user.profile;

    return Senders.find({ clientId }, {
      sort: {
        senderName: 1,
      },
      fields: {updatedAt:0, owner:0},
    });
  });
  Meteor.publish("sendersWithEmail", (limit, findQuery) => {
    check([limit], [Number]);
    check([findQuery], [Object]);

    const user = Meteor.user();
    if (!user) throw new Meteor.Error("not authorized");

    return Senders.find(
      { $and: [findQuery, { senderEmail: { $exists: true, $ne: "" } }, {clientId: user.profile.clientId}] },
      {
        sort: {
          senderName: 1,
        },
        fields: { senderName: 1 },
        limit: limit,
      }
    );
  });
  
  Meteor.publish('senders.app', function () {
    const user = Meteor.user();

    if (!user) return;

    const { clientId } = user.profile;

    return Senders.find({ clientId }, {
            fields: {
              senderName: 1,
            },
            sort: { createdAt: -1 },
            limit: 1000,
          });


  });

  Senders.allow({
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

// default senders
const defaultSenders = [
  { senderName: 'Amazon' },
  { senderName: 'Argos' },
  { senderName: 'Other' },
];

// methods
Meteor.methods({
  'senders.insert': function (senderName, senderEmail, clientId) {
    check([senderName, senderEmail, clientId], [String]);
    // Make sure the user is logged in before inserting a sender
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    let senderdata = {
      senderName,
      senderEmail,
      createdAt: new Date(),
      owner: this.userId,
      username: Meteor.user().username,
      clientId,
    };
    Senders.insert(senderdata);
  },

  loadSenderData() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();

    if (Senders.findOne({ clientId })) return;
    defaultSenders.map((sender) => {
      Senders.insert({
        senderName: sender.senderName,
        createdAt: new Date(),
        owner: this.userId,
        username: user.username,
        clientId: user.profile.clientId,
        fakeData: true,
      });
    });
  },

  'senders.update': function (_id, senderName, senderEmail) {
    check([_id, senderName, senderEmail], [String]);

    const senderId = Senders.findOne(_id);

    Senders.update(senderId, {
      $set: {
        senderName,
        senderEmail,
        updatedAt: new Date(),
      },
    });
  },
  "senders.sendersWithEmail": function () {

    const user = Meteor.user();
    if (!user) return;

    return Senders.find({ $and: [{ clientId: user.profile.clientId }, { senderEmail: { $exists: true, $ne: "" } }] }, { fields: { senderName: 1 } }).fetch();
  },
  'senders.checksender': function updateLocation(senderName,identifyData) {
    check(senderName, String);
    check(identifyData, Object);
    const clientId = identifyData.clientId;
    if (Senders.findOne({ senderName, "clientId": clientId })) return;

    Senders.insert({
      ...identifyData,
      senderName,
    });
  },
  // delete sender
  'senders.remove': function (senderIds) {
    check(senderIds, Array);
    if (!Meteor.user()) throw new Meteor.Error('not authorized to perform this action');
    Senders.remove({ _id: { $in: senderIds} });
    return true;
  },

});
