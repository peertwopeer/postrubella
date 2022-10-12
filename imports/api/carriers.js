import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Match } from 'meteor/check';

const Carriers = new Mongo.Collection('carriers');

export default Carriers;

if (Meteor.isServer) {
  Meteor.publish('carriers.admin', (clientId) => {
    
    check(clientId, Match.OneOf(String, Boolean, undefined));
    const user = Meteor.user();

    if (!user) return console.error('no user in carriers sub');
    if (!Roles.userIsInRole(user._id, ['super-admin'])) return console.error('not super-admin');

    clientId = clientId || user.profile.clientId;

    return Carriers.find({'clientId' : clientId }, {
      sort: {
        carrierName: 1,
      },
      fields: {updatedAt:0, owner:0},

    });
  });
  Meteor.publish('carriers', (clientId) =>  {
    check(clientId, Match.OneOf(String, Boolean, undefined));
    const user = Meteor.user();

    if (!user) return console.error('no user in carriers sub');
        
    clientId = clientId || user.profile.clientId;

    return Carriers.find({
            'clientId' : clientId,
          }, { 
            sort: {
              carrierName: 1,
            },
            fields: {updatedAt:0, owner:0},
          });

  });
  
  Meteor.publish('carriers.app', () => {
    const user = Meteor.user();

    if (!user) return console.error('no user in carriers sub');

        return Carriers.find({
            clientId: user.profile.clientId,
          }, {
            fields: {
              carrierName: 1,
              createdAt: -1,
            },
            sort: {
              createdAt: -1,
            },
            limit: 1000,
          });
   
  });

  //carriers sebscriptions for dropdowns
  Meteor.publish('carriers.list.dropdowns', (limit,findQuery) => {
    check(limit, Number);
    check(findQuery, Object);
    //authentication
    const user = Meteor.user();
    if (!user) throw new Meteor.Error('not authorized');
    findQuery.clientId = Meteor.user().profile.clientId;
    return Carriers.find(findQuery,{
      sort: {
        carrierName: 1,
      },
      fields: {carrierName:1},
      limit: limit
    }); 
  });
  
  Carriers.allow({
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

  // default carriers
  const defaultCarriers = [
    { carrierName: 'City Sprint' },
    { carrierName: 'Crossflight' },
    { carrierName: 'DHL' },
    { carrierName: 'FedEx' },
    { carrierName: 'Hermes' },
    { carrierName: 'Parcel Force' },
    { carrierName: 'Royal Mail' },
    { carrierName: 'TNT' },
    { carrierName: 'UK MAIL' },
    { carrierName: 'UPS' },
    { carrierName: 'Yodel' },
    { carrierName: 'Other' },
  ];

  // methods

  Meteor.methods({
    'carriers.insert': function insertCarrier(carrierName) {
      check(carrierName, String);
      const user = Meteor.user();

      if (!user) {
        throw new Meteor.Error('not-authorized');
      }
      
      Carriers.insert({
        carrierName,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: user._id,
        username: user.username,
        clientId: Meteor.user().profile.clientId,
      });
    },

    loadCarrierData() {
      const user = Meteor.user();

      if (!user) {
        throw new Meteor.Error('not-authorized');
      }

      defaultCarriers.forEach((carrier) => {
        Carriers.insert({
          carrierName: carrier.carrierName,
          createdAt: new Date(),
          owner: user._id,
          username: user.username,
          clientId: user.profile.clientId,
          fakeData: true,
        });
      });
    },

    'carriers.update': function updateCarrierName(_id, carrierName) {
      check([_id, carrierName], [String]);

      const user = Meteor.user();

      if (!user) console.error('not authorized');

      const { clientId } = user.profile;
      const existing = Carriers.findOne({
        clientId,
        carrierName,
      });

      if (existing) throw new Meteor.Error('Carrier with this name is already exist');

      Carriers.update({
        _id,
        clientId,
      }, {
        $set: {
          carrierName,
          updatedAt: new Date(),
        },
      });
    },

    'carriers.update.admin': function updateCarrierName(_id, carrierName) {
      check([_id, carrierName], [String]);

      const user = Meteor.user();

      if (!user || !Roles.userIsInRole(user._id, ['super-admin'])) console.error('not authorized');

      const { clientId } = Carriers.findOne(_id);

      const existing = Carriers.findOne({
        clientId,
        carrierName,
      });

      if (existing) throw new Meteor.Error('Carrier with this name is already exist for this client');

      Carriers.update(_id, {
        $set: {
          carrierName,
          updatedAt: new Date(),
        },
      });
    },

    'carriers.checkcarrier': function updateLocation(carrierName,identifyData) {
      check([carrierName], [String]);
      check(identifyData, Object);



      if (Carriers.findOne({ carrierName })) return;

      Carriers.insert({
        ...identifyData,
        carrierName,
      });
    },

    // delete carriers
    'carriers.remove': function (carrierIds) {
      check(carrierIds, Array);
      if (!Meteor.user()) throw new Meteor.Error('not authorized to perform this action');
      Carriers.remove({ _id: { $in: carrierIds} });
      return true;
    },
 });
}
