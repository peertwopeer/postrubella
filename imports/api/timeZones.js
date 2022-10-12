import { Mongo }        from 'meteor/mongo';
import { Meteor }       from 'meteor/meteor';
import { check }        from 'meteor/check';

export const timeZones = new Mongo.Collection('timeZones');



if (Meteor.isServer) {    
  
  //list timeZones for clients.
  Meteor.publish('time-zones', (limit,findQuery) => {
    check(limit, Number);
    check(findQuery, Object);

    const user = Meteor.user();
    clientId = user.profile.clientId;
    return timeZones.find(findQuery, {
      sort: {
        zone: 1,
      },
      limit: limit,
      fields: {zone:1}
    });
   
  });
    timeZones.allow({
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



