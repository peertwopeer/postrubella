import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

const s3UploadLogs = new Mongo.Collection('s3UploadLogs');

//upload types
// REPORT-CSV

export default s3UploadLogs;

if (Meteor.isServer) {
  //publications
  Meteor.publish('s3UploadLogs.admin', () => {
    const user = Meteor.user();

    if (!user) return console.error('user not found');
    if (!Roles.userIsInRole(user._id, ['super-admin'])) return console.error('not super-admin');

    return s3UploadLogs.find({}, {
      sort: {
        createdAt: -1,
      },
    });
  });
  

  // methods
  Meteor.methods({

    's3UploadLogs.insert': function insertS3UploadLogs(bucket,key,type) {
      check([type, bucket, key], String);

      s3UploadLogs.insert({
        bucket,
        key,
        type,
        createdAt: new Date()
      });
    },

  });
}
