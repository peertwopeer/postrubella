import { Meteor }   from    'meteor/meteor';
import { Mongo }    from    'meteor/mongo';
import { DeliveryTypes } from '/imports/api/deliveryTypes.js';
import { Clients } from '/imports/api/clients.js';

export const Config = new Mongo.Collection('config');

if (Meteor.isServer) {
  Config.update({}, {
    $set: {
      version: '23.15',
    },
  }, {
    upsert: true,
  });
  Meteor.publish('config.version', () => Config.find({}, {
    fields: {
      version: 1,
    },
  }));



  Meteor.methods({
    'deliveryTypes.cleanDb':function(){
      const userIds = Meteor.users.find().fetch();
      let userarray = userIds.map(function(value){
        return value._id;
      });
      let invalidDeliveryTypes = DeliveryTypes.find({ owner:{$nin:userarray}}).fetch();
      let deliveryTypesArray = invalidDeliveryTypes.map(function(value){
        return value._id;
      });
      let orphanRecordsLength = deliveryTypesArray.length;
      DeliveryTypes.remove({ "_id": { "$in": deliveryTypesArray } });
      //delete duplicate records
      const clients = Clients.find({}).fetch();
      let invalidDtypeIds = [];
      clients.map(function(client){

        entries = [];
        DeliveryTypes.find({ clientId:client._id}).fetch().map(function(types){
          if(entries.indexOf(types.deliveryTypeName.trim()) !== -1){
            invalidDtypeIds.push(types._id);
            }else{
            entries.push(types.deliveryTypeName.trim());
            }
        });

      }
      );

      DeliveryTypes.remove({ "_id": { "$in": invalidDtypeIds } });


      let clientarray = clients.map(function(value){
        return value._id;
      });
      let invalidDeliveryTypes2 = DeliveryTypes.find({ clientId:{$nin:clientarray}}).fetch();
      let deliveryTypesArray2 = invalidDeliveryTypes2.map(function(value){
        return value._id;
      });
      DeliveryTypes.remove({ "_id": { "$in": deliveryTypesArray2 } });

      
      return orphanRecordsLength + invalidDtypeIds.length + deliveryTypesArray2.length;
    },
  });



}
