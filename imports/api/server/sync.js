import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import moment from "moment";
import _ from "lodash";

import { Parcels } from "../parcels";
import { Senders } from "../senders";
import { Recipients } from "../recipients";
import Carriers from "../carriers";

// Spaces
let barcodesFolder = "barcodes";
let signaturesFolder = "signatures";

if (Meteor.absoluteUrl().includes("localhost")) {
  barcodesFolder = "tmp/barcodes";
  signaturesFolder = "tmp/signatures";
}
if (Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")) {
  barcodesFolder = "tmp/barcodes";
  signaturesFolder = "tmp/signatures";
}

Meteor.methods({
  /**
   * Sync parcels from offline app
   *
   * For now parcels are syncing one by one through this method.
   * Parcel can be new from device, or updated on device. So it can be created or updated on main db.
   *
   * @param parcelId
   * @param doc - offline parcel data
   * @returns doc - new / updated parcel
   */
  "sync.parcels": async (parcelId, doc) => {
    // path to store data for parcels in spaces
    const todayPath = moment().format("YYYY/MM/DD");

    // check
    check(parcelId, String);
    check(doc, Object);
    // format
    delete doc._rev;
    doc.offline = false;

    // find
    const parcel = Parcels.findOne(parcelId);

    if (doc.deliveredAt) {
      doc.recipientSignatureImage = `https://postrubella.ams3.digitaloceanspaces.com/${signaturesFolder}/${todayPath}/${parcelId}.png`;
      Meteor.call("s3.signature", doc.recipientSignature, parcelId, todayPath);
    }

    // update
    if (parcel) {
      doc.updatedAt = new Date();

      let update = {
        // only updates the fields they are allow to update
        notes: doc.notes,
        // carrier: doc.carrier,
        deliveredAt: doc.deliveredAt,
        deliveredByOwner: doc.deliveredByOwner,
        deliveredByUsername: doc.deliveredByUsername,
        recipientSignatureImage: doc.recipientSignatureImage,
        recipientName: doc.recipientName,
        outboundAddress: doc.outboundAddress,
        signee: doc.signee,
        postbagOwner: doc.postbagOwner,
        attemptedToDeliver: doc.attemptedToDeliver,
        numberOfItems: doc.numberOfItems,
        updatedAt: doc.updatedAt,
        offline: false, // once they are imported we can consider them online
      };

      update = _.omitBy(
        update,
        (field) => _.isUndefined(field) || _.isNull(field)
      );
      Parcels.update(
        parcelId,
        {
          $set: update,
        },
        (error, data) => {
          if (error) console.error(error);
        }
      );
    } else if (!parcel) {
      const { _id } = doc;

      doc = _.omitBy(doc, (field) => _.isUndefined(field) || _.isNull(field));

      if (typeof _id !== "string" || _id.length !== 17) {
        delete doc._id; // lets have some nice meteor _id rather than Pouch
      }

      // create qrcode for parcel
      doc.qrcode = `https://postrubella.ams3.digitaloceanspaces.com/${barcodesFolder}/${todayPath}/${doc.clientUniqueBarcode}.png`;
      Meteor.call("s3.barcode", doc.clientUniqueBarcode, todayPath);
      doc.createdAt = new Date();
      Parcels.insert(doc);
    }

    // done
    return doc;
  },

  "sync.counts": async () => {
    const user = Meteor.user();

    if (!user) return;

    const { clientId } = user.profile;

    return {
      carriers: Carriers.find({ clientId }, { fields: { _id: 1 } }).count(),
      senders: Senders.find({ clientId }, { fields: { _id: 1 } }).count(),
      recipients: Recipients.find({ clientId }, { fields: { _id: 1 } }).count(),
    };
  },
});
