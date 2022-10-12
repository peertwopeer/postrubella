import { Mongo } from "meteor/mongo";
import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { Clients } from "/imports/api/clients.js";
import { Locations } from "/imports/api/locations.js";
import { Parcels } from "/imports/api/parcels";

export const clientsGroups = new Mongo.Collection("clientsGroups");

export default clientsGroups;

if (Meteor.isServer) {
  //methods
  Meteor.methods({
    "clientsGroups.clientsLists": function (searchParams) {
      check(searchParams, Object);
      if (!Meteor.user()) throw new Meteor.Error("not authorized to perform this action");

      return Clients.find(searchParams, {
        fields: { _id: 1, clientName: 1 },
        sort: [["clientName", "asc"]],
      }).fetch();
    },
    "clientsGroups.Locations": function (clientGroupId) {
      check(clientGroupId, Object);

      if (!Meteor.user()) throw new Meteor.Error("not authorized to perform this action");

      const clientGroup = clientsGroups.find(clientGroupId, { fields: { clients: 1 } }).fetch();
      return Locations.find({ $and: [{ clientId: { $in: clientGroup[0].clients } }] }, { fields: { locationName: 1, clientId: 1 } }).fetch();
    },
    "clientGroups.findGroupParcel": function (barcode, clientGroupId) {
      check([barcode, clientGroupId], [String]);

      const user = Meteor.user();
      if (!user) throw new Meteor.Error("not authorized");

      const clientGroup = clientsGroups.find({ _id: clientGroupId }, { fields: { clients: 1 } }).fetch();
      return Parcels.find(
        { $and: [{ destinationId: { $in: clientGroup[0].clients } }, { barcode }, { type: "outbound" }, { deliveredAt: null }] },
        { sort: { updatedAt: -1 }, limit: 1, fields: { createdAt: 0, updatedAt: 0, clientId: 0, owner: 0, qrcode: 0 } }
      ).fetch();
    },
  });
}
