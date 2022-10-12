import { Meteor }       from 'meteor/meteor';
import { Mongo }        from 'meteor/mongo';
import { check }        from 'meteor/check';
import { Parcels }      from '/imports/api/parcels';

if (!Meteor.isServer) {
  return;
}
Meteor.methods({

  // get parcel
  getParcel(parcelId) {
    check(parcelId, String)
    const currentParcel = Parcels.find({ clientUniqueBarcode: parcelId }).fetch();

    console.log('========= Current parcel has been returned to the client. =========');

    return currentParcel;
  },

});
