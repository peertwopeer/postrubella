import { Mongo } from "meteor/mongo";
import { check } from "meteor/check";
import { Match } from "meteor/check";
import moment from "moment-timezone";
import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Clients } from "/imports/api/clients.js";
import { parcelLogs } from "/imports/api/parcelLogs.js";

export const Parcels = new Mongo.Collection("parcels");

// Spaces
const spacesFolder = "postrubella/tmp";

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

// server
if (Meteor.isServer) {
  // Parcels subscription for report listing
  Meteor.publish("parcelsForReport", function (searchParams, limit) {
    check([searchParams], [Object]);
    check(limit, Number);
    const user = Meteor.user();

    if (!user) throw new Meteor.Error("not-authorized");

    searchParams.clientId = user.profile.clientId;
    searchParams.$or[0].createdAt.$gte = new Date(
      new Date(searchParams.$or[0].createdAt.$gte).toISOString()
    );
    searchParams.$or[0].createdAt.$lte = new Date(
      new Date(searchParams.$or[0].createdAt.$lte).toISOString()
    );
    searchParams.$or[1].deliveredAt.$gte = new Date(
      new Date(searchParams.$or[1].deliveredAt.$gte).toISOString()
    );
    searchParams.$or[1].deliveredAt.$lte = new Date(
      new Date(searchParams.$or[1].deliveredAt.$lte).toISOString()
    );

    return Parcels.find(searchParams, {
      fields: {
        postrubellaBarcode: 0,
        recipientSignature: 0,
        owner: 0,
        deliveredByOwner: 0,
        clientId: 0,
      },
      limit: limit,
      sort: { createdAt: -1 },
    });
  });

  Meteor.publish("parcelsUndelivered", function () {
    const user = Meteor.user();

    if (!user) throw new Meteor.Error("not-authorized");

    return Parcels.find(
      {
        $or: [
          { clientId: user.profile.clientId, deliveredAt: null },
          {
            $and: [
              { locationClientId: user.profile.clientId },
              { deliveredAt: null },
              { type: "inbound" },
            ],
          },
        ],
      },
      {
        fields: {
          postrubellaBarcode: 0,
          recipientSignature: 0,
          owner: 0,
          deliveredByOwner: 0,
          clientId: 0,
        },
        sort: { createdAt: -1 },
        limit: 3000,
      }
    );
  });

  Meteor.publish("parcelsForListing", function (limit) {
    check(limit, Match.OneOf(Number, undefined));
    const user = Meteor.user();

    if (!user) throw new Meteor.Error("not-authorized");

    return Parcels.find(
      { clientId: user.profile.clientId, deliveredAt: null },
      {
        fields: {
          postrubellaBarcode: 0,
          recipientSignature: 0,
          owner: 0,
          deliveredByOwner: 0,
          clientId: 0,
        },
        sort: { createdAt: -1 },
        limit: limit,
      }
    );
  });

  Parcels.allow({
    insert() {
      return true;
    },
    update() {
      return true;
    },
    remove() {
      return false;
    },
  });
  Meteor.methods({
    // get signature
    getSignature(parcelId) {
      check(parcelId, String);

      return Parcels.find(
        { _id: parcelId },
        { fields: { recipientSignature: 1 } }
      ).fetch();
    },

    // runReport
    "parcels.runReport": (searchParams, limit, skip) => {
      check([searchParams], [Object]);
      check([limit, skip], [Number]);

      const user = Meteor.user();

      if (!user) {
        console.log("Trying to runReport without user");

        return [];
      }

      searchParams.clientId = user.profile.clientId;
      // console.log('--------- Report has been run and sent the clients browser ---------');

      const parcels = Parcels.find(searchParams, {
        fields: {
          postrubellaBarcode: 0,
          recipientSignature: 0,
          owner: 0,
          deliveredByOwner: 0,
          // deliveredByUsername: 0,
          clientId: 0,
        },
        sort: { createdAt: -1 },
        limit: limit,
        skip: skip,
      }).fetch();

      return parcels;
    },

    // parcels.getCount
    "parcels.getCount": (searchParams) => {
      check([searchParams], [Object]);

      const user = Meteor.user();

      if (!user) {
        console.log("Trying to runReport without user");

        return [];
      }

      searchParams.clientId = user.profile.clientId;
      // console.log('--------- Report has been run and sent the clients browser ---------');
      // console.log("calling function");
      // console.log(new Date());
      // console.log(searchParams);
      const parcels = Parcels.find(searchParams, {
        fields: {
          postrubellaBarcode: 0,
          recipientSignature: 0,
          owner: 0,
          deliveredByOwner: 0,
          // deliveredByUsername: 0,
          clientId: 0,
        },
        sort: { createdAt: -1 },
      }).fetch();

      const resultData = Parcels.aggregate(
        [
          { $match: { location: "Ivybridge" } },
          { $group: { _id: "$deliveryUser", count: { $sum: 1 } } },
          { $project: { notes: 1, barcode: 1, location: 1 } },
        ],
        {
          cursor: { batchSize: 500 },
          allowDiskUse: true,
          explain: false,
        },
        null
      );
      return resultData;
    },
    "parcels.totalCount": function parcelstotalCount(searchParams) {
      check([searchParams], [Object]);
      return Parcels.find(searchParams).count();
    },
    "parcels.checkBarcode": () => {
      var parcel_list = Parcels.findOne(
        { barcode: "48484747u4u" },
        {
          sort: { createdAt: -1 },
          limit: 1,
        }
      );

      console.log("parcel_list_nevil : ", parcel_list);

      return parcel_list != "" &&
        typeof parcel_list != "undefined" &&
        parcel_list != undefined &&
        parcel_list != null
        ? true
        : false;
    },
    // Get parcel details
    "parcels.getParcelDetails": function (parcelId) {
      check(parcelId, String);
      if (!Meteor.user())
        throw new Meteor.Error("not authorized to perform this action");
      return Parcels.find(parcelId, {
        fields: {
          owner: 0,
          senderId: 0,
          locationId: 0,
          destinationId: 0,
          locationClientId: 0,
          deliveredByOwner: 0,
        },
      }).fetch()[0];
    },
    // Get parcel logs
    "parcels.getParcelLogs": function (parcelId) {
      check(parcelId, String);
      if (!Meteor.user())
        throw new Meteor.Error("not authorized to perform this action");
      return parcelLogs.find({ parcelId }).fetch()[0];
    },
  });
}

if (!Meteor.isServer) return;

const syncTimes = {};
const syncCounts = {};
const timers = {};

function logCounts(name) {
  if (syncCounts[name] !== 0) {
    console.log(
      `${name} ${syncCounts[name]} between ${syncTimes[name]} - ${new Date()}`
    );
  }
  syncCounts[name] = 0;
}

function logCountAfter(name, time = 1000 * 60 * 10) {
  if (!syncCounts[name]) syncCounts[name] = 0;
  Meteor.clearTimeout(timers[name]);
  if (syncCounts[name] === 0) syncTimes[name] = Date.now();
  syncCounts[name] += 1;
  timers[name] = Meteor.setTimeout(() => logCounts(name), time);
}
Meteor.methods({
  /**
   * Server-side (secure) insert
   *
   * @TODO: implement
   */
  "parcels.insert": (parcel) => {
    check(parcel, Object);
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
  },

  "parcels.updateClientUniqueBarcode": function updateClientUniqueBarcode(
    clientId,
    clientBarcodeNumber
  ) {
    check(clientId, String);
    check(clientBarcodeNumber, Number);
    //update client
    Clients.update(clientId, {
      $set: {
        clientBarcodeNumber,
        updatedAt: new Date(),
      },
    });
  },
  /**
   * Server-side (secure) update
   *
   * @TODO: implement
   */
  "parcels.update": (parcelId, setFields) => {
    check(parcelId, String);
    check(setFields, Object);
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    setFields.updatedAt = new Date();
    console.log("recipientSignatureImage", setFields.recipientSignatureImage);
    Parcels.update(parcelId, {
      $set: setFields,
    });
  },

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
  "parcels.sync": async (parcelId, doc) => {
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
      let update = {
        offline: false, // once they are imported we can consider them online
        ...(doc.carrier && { carrier: doc.carrier }),
        ...(doc.location && { location: doc.location }),
        ...(doc.locationId && { locationId: doc.locationId }),
        ...(doc.deliveryType && { deliveryType: doc.deliveryType }),
        ...(doc.deliveryUser && { deliveryUser: doc.deliveryUser }),
        ...(doc.qrcode && { qrcode: doc.qrcode }),
        ...(doc.clientUniqueBarcode && {
          clientUniqueBarcode: doc.clientUniqueBarcode,
        }),
        ...(doc.type && { type: doc.type }),
        ...(doc.outboundAddress && { outboundAddress: doc.outboundAddress }),
        ...(doc.recipientName && { recipientName: doc.recipientName }),
        ...(doc.numberOfItems && { numberOfItems: doc.numberOfItems }),
        ...(doc.notes && { notes: doc.notes }),
        ...(doc.photoName && { photoName: doc.photoName }),
        ...(doc.destination && { destination: doc.destination }),
        ...(doc.lastProcessed && { lastProcessed: doc.lastProcessed }),
        ...(doc.destinationId && { destinationId: doc.destinationId }),
        ...(doc.sender && { sender: doc.sender }),
        ...(doc.senderId && { senderId: doc.senderId }),
        ...(doc.deliveredAt && { deliveredAt: doc.deliveredAt }),
        ...(doc.locationClientId && { locationClientId: doc.locationClientId }),
        ...(doc.deliveredByOwner && { deliveredByOwner: doc.deliveredByOwner }),
        ...(doc.deliveredByUsername && {
          deliveredByUsername: doc.deliveredByUsername,
        }),
        ...(doc.recipientSignatureImage && {
          recipientSignatureImage: doc.recipientSignatureImage,
        }),
        ...(doc.signee && { signee: doc.signee }),
        ...((doc.postbagOwner || doc.postbagOwner == "") && {
          postbagOwner: doc.postbagOwner,
        }),
        ...(doc.attemptedToDeliver && {
          attemptedToDeliver: doc.attemptedToDeliver,
        }),
        ...(doc.offlineDate && { offlineDate: doc.offlineDate }),
        ...(doc.updatedAt && { updatedAt: doc.updatedAt }),
      };
      update = _.omitBy(update, (field, key) => {
        const isFieldDroping = _.isUndefined(field) || _.isNull(field);

        if (isFieldDroping) {
          //console.log('Warning! erasing data field!', key, field);
        }

        return isFieldDroping;
      });
      doc.updatedAt = new Date();
      Parcels.update(
        parcelId,
        {
          $set: update,
        },
        (error, data) => {
          if (error) console.error(error);
        }
      );
      logCountAfter("Sync updated parcels");
    } else if (!parcel) {
      const { _id } = doc;

      doc = _.omitBy(doc, (field, key) => {
        const isFieldDroping = _.isUndefined(field) || _.isNull(field);

        if (isFieldDroping) {
          console.log("Warning! erasing data field!", key, field);
        }

        return isFieldDroping;
      });

      if (typeof _id !== "string" || _id.length !== 17) {
        delete doc._id; // lets have some nice meteor _id rather than Pouch
      }

      // create qrcode for parcel
      doc.qrcode = `https://postrubella.ams3.digitaloceanspaces.com/${barcodesFolder}/${todayPath}/${doc.clientUniqueBarcode}.png`;
      Meteor.call("s3.barcode", doc.clientUniqueBarcode, todayPath);
      doc.createdAt = new Date();
      doc.updatedAt = new Date();
      Parcels.insert(doc);
      logCountAfter("Sync new parcels");
    }

    // done
    return doc;
  },

  //api call for sla report data
  "generate-sla-api": async (searchParams) => {
    check([searchParams], [Object]);
    var result = await fetch(
      Meteor.settings.public.api_service.url + "/api/report/generate-sla",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      }
    )
      .then((response) => response.text())
      .then((json) => {
        // 2
        return JSON.parse(json);
      })
      .catch((error) => {
        console.log(error);
      });
    return Promise.resolve(result);
  },

  //api call for line chart report data
  "generate-line-chart-api": async (searchParams) => {
    check([searchParams], [Object]);
    var result = await fetch(
      Meteor.settings.public.api_service.url +
        "/api/report/generate-line-chart",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      }
    )
      .then((response) => response.text())
      .then((json) => {
        // 2
        return JSON.parse(json);
      })
      .catch((error) => {
        console.log(error);
      });
    return Promise.resolve(result);
  },

  //api call  for email sla report
  "email-sla-report": async (Params) => {
    check([Params], [Object]);
    var result = await fetch(
      Meteor.settings.public.api_service.url + "/api/report/email-sla",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Params),
      }
    )
      .then((response) => response.text())
      .then((json) => {
        // 2
        return JSON.parse(json);
      })
      .catch((error) => {
        console.log(error);
      });
    return Promise.resolve(result);
  },

  //api call  for email report
  "email-report": async (Params) => {
    check([Params], [Object]);
    var result = await fetch(
      Meteor.settings.public.api_service.url + "/api/report/email-report",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Params),
      }
    )
      .then((response) => response.text())
      .then((json) => {
        // 2
        return JSON.parse(json);
      })
      .catch((error) => {
        console.log(error);
      });
    return Promise.resolve(result);
  },

  //api call  for email csv report
  "email-csv-report": async (Params) => {
    check([Params], [Object]);
    var result = await fetch(
      Meteor.settings.public.api_service.url + "/api/report/email-csv-report",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Params),
      }
    )
      .then((response) => response.text())
      .then((json) => {
        // 2
        return JSON.parse(json);
      })
      .catch((error) => {
        console.log(error);
      });
    return Promise.resolve(result);
  },
  undeliveredParcelsCount: async (Params) => {
    check([Params], [Object]);
    var result = await fetch(
      Meteor.settings.public.api_service.url + "/api/undelivered-parcels-count",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Params),
      }
    )
      .then((response) => response.text())
      .then((json) => {
        // 2
        return JSON.parse(json);
      })
      .catch((error) => {
        console.log(error);
      });
    return Promise.resolve(result);
  },
});
