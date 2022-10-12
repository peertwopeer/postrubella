import { Meteor } from 'meteor/meteor';
import { Mongo }  from 'meteor/mongo';
import { check }  from 'meteor/check';


const userLoginActivity = new Mongo.Collection('userLoginActivity');

export default userLoginActivity;

if (Meteor.isServer) {
  
   // methods
   Meteor.methods({

    'userLoginActivity.insert': function insertuserLoginActivity(user,source,platform) {
      check(user, Object);
      check([source, platform], [String]);
      userLoginActivity.insert({
        userId: user._id,
        source,
        platform,
        createdAt: new Date()
      });
    },

  });
}
