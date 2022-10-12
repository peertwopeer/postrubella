import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { check } from "meteor/check";
import { Match } from "meteor/check";

import AWS from "aws-sdk";

export const Clients = new Mongo.Collection("clients");

if (Meteor.isServer) {
  // S3 Configuration
  const spacesEndpoint = new AWS.Endpoint("ams3.digitaloceanspaces.com");
  const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: Meteor.settings.private.spaces.ACCESS_KEY,
    secretAccessKey: Meteor.settings.private.spaces.SECRET_KEY,
  });
  // Spaces
  let spacesFolderLogo = "postrubella/public/logos";

  if (Meteor.absoluteUrl().includes("localhost")) {
    spacesFolderLogo = "postrubella/public/logos/dev";
  }
  if (Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")) {
    spacesFolderLogo = "postrubella/public/logos/dev";
  }

  Meteor.publish("clients", function clientsPublication() {
    const user = Meteor.user();

    if (!user) return [];
    const { clientId } = user.profile;
    //clients for super-admin
    if (Roles.userIsInRole(this.userId, ["super-admin"])) {
      return Clients.find(
        {},
        { sort: { clientName: 1 }, fields: { owner: 0 } }
      );
    }
    //clients for non super users
    return Clients.find(
      { _id: clientId },
      { sort: { clientName: 1 }, fields: { owner: 0 } }
    );
  });
  // eslint-disable-next-line prefer-arrow-callback
  Meteor.publish("currentClient", function clientsPublication2() {
    const user = Meteor.user();

    if (!user) return [];

    const { clientId } = user.profile;

    return Clients.find(
      {
        _id: clientId,
      },
      {
        // fields: {
        //   createdAt: 0,
        //   updatedAt: 0,
        // },
      }
    );
  });
  Clients.allow({
    insert() {
      return true;
    },
    update() {
      return true;
    },
    remove() {
      return true;
    },
  });

  // methods
  Meteor.methods({
    "clients.insert": (newClient) => {
      check(newClient, Object);
      try {
        const user = Meteor.user();

        if (!user) return new Error("not autorized to create client");
        let clientName = newClient.clientName;
        let clientEmail = newClient.clientEmail;
        let clientBarcodeId = newClient.clientBarcodeId;
        let clientBarcodeNumber = newClient.clientBarcodeNumber;
        let defaultLanguage = newClient.defaultLanguage;
        let optionalLanguages = newClient.optionalLanguages;
        let defaultTimeZone = newClient.defaultTimeZone;
        let optionalTimeZones = newClient.optionalTimeZones;
        let logo = newClient.logo;
        let customEmail = newClient.customEmail;
        check(
          [
            clientName,
            clientEmail,
            clientBarcodeId,
            defaultLanguage,
            defaultTimeZone,
          ],
          [String]
        );
        check(clientBarcodeNumber, Number);
        var result = Clients.insert({
          clientName,
          clientEmail,
          clientBarcodeId,
          clientBarcodeNumber,
          defaultLanguage,
          optionalLanguages,
          defaultTimeZone,
          optionalTimeZones,
          customEmail,
          createdAt: new Date(),
          owner: user._id,
          username: user.username,
        });
        //upload logo
        if (typeof logo !== "undefined" && logo !== "") {
          const formattedUserId = clientEmail
            .replace(/@/g, "-")
            .replace(/\./g, "-");
          var logoName = `${formattedUserId}-logo.png`;

          var buf = Buffer.from(
            logo.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
          );
          // params for s3 upload logo image
          const paramsLogo = {
            Body: buf,
            Bucket: `${spacesFolderLogo}`,
            Key: `${logoName}`,
            ContentEncoding: "base64",
            ContentType: "image/jpeg",
            ACL: "public-read",
          };
          // Add file to a Space
          s3.upload(
            paramsLogo,
            Meteor.bindEnvironment((err, data) => {
              if (err) {
                console.log(err, err.stack);
              } else {
                Clients.update(
                  { clientEmail },
                  {
                    $set: {
                      logo: data.Location,
                    },
                  }
                );
              }
            })
          );
        }
        // output result
        return result;
      } catch (error) {
        console.log(error);
      }
    },

    "clients.update": function updateClient(
      _id,
      clientName,
      clientEmail,
      clientBarcodeId,
      deliveryType,
      deliveryUser,
      receiveUser,
      defaultLanguage,
      optionalLanguages,
      defaultTimeZone,
      optionalTimeZones,
      logo,
      customEmail
    ) {
      check(
        [
          _id,
          clientName,
          clientEmail,
          clientBarcodeId,
          deliveryType,
          deliveryUser,
          receiveUser,
          defaultTimeZone,
          defaultLanguage,
        ],
        [String]
      );
      check([optionalLanguages, optionalTimeZones], [Array]);

      try {
        const user = Meteor.user();

        if (!user) return new Error("not autorized to create client");

        const clientId = Clients.findOne(_id);

        Clients.update(clientId, {
          $set: {
            clientName,
            clientEmail,
            clientBarcodeId,
            deliveryType,
            deliveryUser,
            receiveUser,
            defaultLanguage,
            optionalLanguages,
            defaultTimeZone,
            optionalTimeZones,
            customEmail,
            updatedAt: new Date(),
          },
        });
        if (typeof logo !== "undefined" && logo !== "") {
          const formattedUserId = clientEmail
            .replace(/@/g, "-")
            .replace(/\./g, "-");
          var logoName = `${formattedUserId}-logo.png`;

          var buf = Buffer.from(
            logo.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
          );
          // params for s3 upload logo image
          const paramsLogo = {
            Body: buf,
            Bucket: `${spacesFolderLogo}`,
            Key: `${logoName}`,
            ContentEncoding: "base64",
            ContentType: "image/jpeg",
            ACL: "public-read",
          };
          // Add file to a Space
          s3.upload(
            paramsLogo,
            Meteor.bindEnvironment((err, data) => {
              if (err) {
                console.log(err, err.stack);
              } else {
                Clients.update(
                  { clientEmail },
                  {
                    $set: {
                      logo: data.Location,
                    },
                  }
                );
              }
            })
          );
        }
        return true;
      } catch (error) {
        console.log(error);
      }
    },

    "clients.update.defaultValues": function updateClient(
      _id,
      deliveryType,
      deliveryUser,
      receiveUser
    ) {
      check([_id, deliveryType, deliveryUser, receiveUser], [String]);
      try {
        const user = Meteor.user();

        if (!user) return new Error("not autorized to create client");

        const clientId = Clients.findOne(_id);

        Clients.update(clientId, {
          $set: {
            deliveryType,
            deliveryUser,
            receiveUser,
            updatedAt: new Date(),
          },
        });
        return true;
      } catch (error) {
        console.log(error);
      }
    },

    "clients.showDetails": function showDetails(clientId) {
      check([clientId], [String]);
      const user = Meteor.user();

      if (!user) return new Error("not autorized to create client");

      return Clients.find({ _id: clientId }).fetch();
    },

    "clients.removeLogo": function removeLogo(clientId) {
      check([clientId], [String]);

      try {
        const user = Meteor.user();
        if (!user) return new Error("not autorized to create client");

        const logoUrl = Clients.find({ _id: clientId }).fetch()[0].logo;
        const logoName = logoUrl.substring(
          logoUrl.lastIndexOf("/") + 1,
          logoUrl.length
        );

        s3.deleteObject(
          { Key: logoName, Bucket: `${spacesFolderLogo}` },
          (err, data) => {
            if (err) console.log(err, err.stack);
          }
        );

        Clients.update(
          { _id: clientId },
          {
            $set: {
              logo: "",
            },
          }
        );

        return true;
      } catch (error) {
        console.log(error);
      }
    },
    // delete clients
    "clients.remove": function (clientId) {
      check(clientId, String);
      if (!Meteor.user())
        throw new Meteor.Error("not authorized to perform this action");
      Clients.remove(clientId);
      return true;
    },
  });
}
