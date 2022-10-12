import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const DefaultCarriers = new Mongo.Collection('defaultCarriers');

// Deny all client-side updates
DefaultCarriers.deny({
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

if (Meteor.isServer) {

  Meteor.publish('defaultCarriers',()=>{
      const user = Meteor.user();
     if (!user) {
        throw new Meteor.Error('not-authorized');
      }
       return DefaultCarriers.find();
  })
}
