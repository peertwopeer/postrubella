import { Mongo }        from 'meteor/mongo';

export const Languages = new Mongo.Collection('languages');


if (Meteor.isServer) {
  //list languages for clients.
  Meteor.publish('languages', () => {
 //authentication
 const user = Meteor.user();
 if (!user) throw new Meteor.Error('not authorized');
  return Languages.find({}, {
    sort: {
      name: 1,
    },
  })
  });

  Languages.allow({
      insert() {
        return false;
      },
      update() {
        return true;
      },
      remove() {
        return true;
      },
    });


    Meteor.methods({

    });
}