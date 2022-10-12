import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Match } from 'meteor/check';


export const DeliveryTypes = new Mongo.Collection('deliveryTypes');
// const Users = new Mongo.Collection('users');
if (Meteor.isServer) {

    Meteor.publish('deliveryTypes', (clientId) => {
      check(clientId,Match.OneOf(String,undefined));
      const user = Meteor.user();
      clientId = clientId || user.profile.clientId;
      return DeliveryTypes.find({'clientId' : clientId }, {fields: {updatedAt:0, owner:0}});
     
    });
    Meteor.publish('admin.deliveryTypes', (clientId) => {
      check(clientId, Match.OneOf(String,null));
      const user = Meteor.user();
      clientId = clientId || user.profile.clientId;
      return DeliveryTypes.find({'clientId' : clientId }, {fields: {updatedAt:0, owner:0}});
     
    });
    Meteor.publish('allDeliveryTypes', () => {

      const user = Meteor.user();
      if (!user) throw new Meteor.Error('not authorized');
      return DeliveryTypes.find({});
     
    });
  //DeliveryTypes sebscriptions for dropdowns
  Meteor.publish('deliveryTypes.list.dropdowns', (limit,findQuery) => {
    check([limit], [Number]);
    check([findQuery], [Object]);
    //authentication
    const user = Meteor.user();
    if (!user) throw new Meteor.Error('not authorized');
    findQuery.clientId = Meteor.user().profile.clientId;
    return DeliveryTypes.find(findQuery,{
      limit:limit,
      // fields: {carrierName:1}
    }); 
  });

  DeliveryTypes.allow({
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
// default carriers
const defaultDeliveryTypes = [
  { deliveryTypeName: 'Small Box' },
  { deliveryTypeName: 'Tube' },
  { deliveryTypeName: 'Letter' },
  { deliveryTypeName: 'Box' },
  { deliveryTypeName: 'Newspapers' },
  { deliveryTypeName: 'Fruits' },
  { deliveryTypeName: 'PC Monitor' },
  { deliveryTypeName: 'Parcel' },
  { deliveryTypeName: 'Milk' },
  { deliveryTypeName: 'Envelope' },
  { deliveryTypeName: 'Package' },
  { deliveryTypeName: 'Personal' },
];

// methods
Meteor.methods({
  'deliveryTypes.insert': function (deliveryTypeName,clientId) {
    check([deliveryTypeName, clientId], [String]);
    DeliveryTypes.insert({
      deliveryTypeName,
      clientId,
      owner: this.userId,
      username: Meteor.users.findOne(this.userId).username,
      createdAt: new Date(),
    });
  },
  loadDeliveryTypesData(clientId) {
    check([clientId],[String]);
    const user = Meteor.user();

    if (!user) {
      throw new Meteor.Error('not-authorized');
    }
    defaultDeliveryTypes.forEach((deliveryType) => {
      DeliveryTypes.insert({
      deliveryTypeName: deliveryType.deliveryTypeName,
      clientId,
      owner: this.userId,
      username: Meteor.users.findOne(this.userId).username,
      createdAt: new Date(),
      });
    });
  },
  'deliveryTypes.update': function (_id, deliveryTypeName) {
    check([_id], [String]);
    check(deliveryTypeName, Match.OneOf(String, undefined));

    DeliveryTypes.update(_id, {
      $set: {
        deliveryTypeName,
        updatedAt: new Date(),
      },
    });
  },

  'deliveryTypes.getuserwise':function(){
    let {clientId} = Meteor.user().profile;
  },
  
  // delete deliveryTypes
  'deliveryTypes.remove': function (deliveryTypeId) {
    check(deliveryTypeId, String);
    if (!Meteor.user()) throw new Meteor.Error('not authorized to perform this action');
    DeliveryTypes.remove(deliveryTypeId);
    return true;
  },
 });
