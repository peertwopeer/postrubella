import { Mongo } from "meteor/mongo";
import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";

export const parcelLogs = new Mongo.Collection("parcelLogs");

export default parcelLogs;


if (Meteor.isServer) {
  // methods
  Meteor.methods({
    "parcelLogs.add": function add(parcelData) {
      check(parcelData, Object);

      if (!this.userId) {
        throw new Meteor.Error("you are not authorized perform this action");
      }

      let track = [{ clientId: parcelData.clientId, time: parcelData.createdAt, clientName: parcelData.clientName }];

      return parcelLogs.insert({
        track,
        status: "created",
        parcelId: parcelData.parcelId,
        barcode: parcelData.barcode,
        clientId: parcelData.clientId,
        clientUniqueBarcode: parcelData.clientUniqueBarcode,
        createdAt: parcelData.createdAt,
        destination: parcelData.destination,
        destinationId: parcelData.destinationId,
        updatedAt: parcelData.updatedAt,
      });
    },
    "parcelLogs.update": function update(parcelData) {
      check(parcelData, Object);

      if (!this.userId) {
        throw new Meteor.Error("you are not authorized perform this action");
      }

      let track = { clientId: parcelData.clientId, time: parcelData.updatedAt, clientName: parcelData.clientName };

      return parcelLogs.update(
        { parcelId: parcelData.parcelId },

        {
          $push: { track },
          $set: {
            status: parcelData.status,
            destination: parcelData.destination,
            destinationId: parcelData.destinationId,
            updatedAt: parcelData.updatedAt,
          },
        }
      );
    },
  });
}
