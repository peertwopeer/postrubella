import { Mongo } from "meteor/mongo";
import { check } from "meteor/check";
import moment from "moment";
import { Meteor } from "meteor/meteor";

export const Locations = new Mongo.Collection("locations");

if (Meteor.isServer) {
  Meteor.publish("adminAllLocations", function locationsPublication() {
    if (Roles.userIsInRole(this.userId, ["super-admin"])) {
      return Locations.find({});
    }
  });
  Meteor.publish("locations", function locationsPublication(clientId) {
    const user = Meteor.user();
    clientId = clientId || user.profile.clientId;
    return Locations.find(
      { clientId },
      {
        sort: {
          locationName: 1,
        },
        fields: { updatedAt: 0, owner: 0 },
      }
    );
  });

  //locations subscriptions for dropdowns
  Meteor.publish("locations.list.dropdowns", (limit, findQuery) => {
    check([limit], [Number]);
    check([findQuery], [Object]);

    const user = Meteor.user();
    if (!user) throw new Meteor.Error("not authorized");
    if (!findQuery.clientId) {
      findQuery.clientId = user.profile.clientId;
    }

    return Locations.find(findQuery, {
      sort: {
        locationName: 1,
      },
      fields: { locationName: 1, clientId: 1 },
      limit: limit,
    });
  });

  Locations.allow({
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
}
// methods
Meteor.methods({
  "locations.insert": function insertLocation(
    locationName,
    locationEmail,
    clientId
  ) {
    check([locationName, locationEmail, clientId], [String]);
    // Make sure the user is logged in before inserting a location
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    const date = new Date();

    Locations.insert({
      locationName,
      locationEmail,
      createdAt: date,
      updatedAt: date,
      owner: this.userId,
      username: Meteor.users.findOne(this.userId).username,
      clientId,
    });
  },
  "locationData.bulkInsert": (data) => {
    check(data, Array);

    const date = new Date();
    let successCount = 0;
    let client = {
      id: "Pv7XYqN9MNKjqXm4T",
      name: "Battersea Concierge",
      owner: "q3phB4kJaADcZnDiz",
      username: "pp1concierge",
    };
    data.forEach((location) => {
      Locations.insert({
        locationName: location[0].trim(),
        username: client.username,
        owner: client.owner,
        clientId: client.id,
        createdAt: date,
        updatedAt: date,
      });
      successCount++;
    });

    return { successCount };
  },

  "locationData.bulkInsert_bak": function bulkInsert(data) {
    check(data, Array);

    const date = new Date();
    const clients = [
      {
        name: "NCBJ Atrium",
        owner: "iMgJoBGbmaNCmwnQY",
        username: "manageratrium",
        clientId: "6uwcrPQAkQgg9Tr9W",
      },
      {
        name: "Mandeville",
        owner: "u7qX2aSMgTRjxRG4A",
        username: "gee",
        clientId: "D3vqFFTPq3mKJ8Jv7",
      },
      {
        name: "Port Maria",
        owner: "u7qX2aSMgTRjxRG4A",
        username: "gee",
        clientId: "GG6DHob9SskRcJL9x",
      },
      {
        name: "Ochi",
        owner: "u7qX2aSMgTRjxRG4A",
        username: "gee",
        clientId: "JgTvBbGxHPHfAFH2T",
      },
      {
        name: "Constant Spring Branch",
        owner: "Kvhfa4fPqN5tWHzek",
        username: "managercsb",
        clientId: "N5qxCGQdJbjdWmjtv",
      },
      {
        name: "NCBJ Trafalgar",
        owner: "iEboTgPtdfJARyM2v",
        username: "managertrafalgar",
        clientId: "pHHHXS7TWy6xe7b97",
      },
      {
        name: "Knutsford",
        owner: "k5HWiS2xgQFxxPm86",
        username: "managerknutsford",
        clientId: "reFFKN6m4MJRfBKze",
      },
    ];
    let successCount = 0;
    let failedCount = 0;

    data.forEach((locationData) => {
      let locationFirstName = locationData[0];
      let locationLastName = locationData[1];
      let locationEmail = locationData[2];
      let locationName = "";
      if (
        typeof locationFirstName !== "undefined" &&
        typeof locationLastName !== "undefined"
      ) {
        locationName = `${locationFirstName} ${locationLastName}`;
      } else if (typeof locationFirstName !== "undefined") {
        locationName = locationFirstName;
      } else if (typeof locationLastName !== "undefined") {
        locationName = locationLastName;
      }
      if (typeof locationEmail !== "undefined" && locationEmail.length <= 0)
        return failedCount++;
      if (typeof locationName !== "undefined" && locationName.length <= 0)
        return failedCount++;
      for (const client of clients) {
        Locations.insert({
          locationName: locationName.trim(),
          locationEmail: locationEmail.trim(),
          createdAt: date,
          updatedAt: date,
          owner: client.owner,
          username: client.username,
          clientId: client.clientId,
        });
      }
      successCount++;
    });
    return { successCount, failedCount };
  },

  "locations.update": function updateLocation(
    _id,
    locationName,
    locationEmail
  ) {
    check([_id, locationName, locationEmail], [String]);
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    const locationId = Locations.findOne(_id);

    Locations.update(locationId, {
      $set: {
        locationName,
        locationEmail,
        updatedAt: new Date(),
      },
    });
  },

  "locations.attemptedToDeliver": async (locationId) => {
    check(locationId, String);

    console.log("in locations.attemptedToDeliver function ");

    var location = Locations.findOne(locationId);

    // console.log("Get Location : ", location);

    console.log(
      "Meteor.settings.private.smtp",
      Meteor.settings.private.smtp.email
    );

    let to = location.locationEmail;
    const subject = "postrubella : Urgent notice Attempted To Deliver";
    const { email } = Meteor.settings.private.smtp;

    var next_time = moment(new Date()).format("h:mm a");
    const template = ejs.render(attemptedToDeliver, { next_time: next_time });

    console.log("From : ", { email });
    console.log("To : ", to);
    console.log("subject : ", subject);
    console.log("Body : ", template);

    try {
      //send email
      await Meteor.call(
        "sendEmail",
        to,
        `org_placeholder postrubella ${email}`,
        subject,
        template
      );

      console.log("Email Sent to " + to);
    } catch (error) {
      Meteor.call(
        "sendToSlack",
        `Attempted To Deliver error ${error.message} sent to: ${to}`
      );
      console.log(error);
    }
  },
  // delete locations
  "locations.remove": function (locationIds) {
    check(locationIds, Array);
    if (!Meteor.user())
      throw new Meteor.Error("not authorized to perform this action");
    Locations.remove({ _id: { $in: locationIds } });
    return true;
  },
  "locations.locationsByClientId": function (clientId) {
    check(clientId, String);
    if (!Meteor.user())
      throw new Meteor.Error("not authorized to perform this action");
    return Locations.find(
      { clientId },
      { fields: { locationName: 1, clientId: 1 } }
    ).fetch();
  },
});
