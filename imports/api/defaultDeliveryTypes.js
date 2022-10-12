import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const DefaultDeliveryTypes = new Mongo.Collection('defaultDeliveryTypes');

if (Meteor.isServer) {

    Meteor.publish('defaultDeliveryTypes',()=>{
        const user = Meteor.user();
       if (!user) {
          throw new Meteor.Error('not-authorized');
        }
         return DefaultDeliveryTypes.find();
    })
}
DefaultDeliveryTypes.allow({
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