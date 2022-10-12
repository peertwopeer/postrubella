import { check } from "meteor/check";
import AWS from "aws-sdk";
import QRCode from "qrcode";
import moment from "moment-timezone";

// Configure client for use with Spaces
const spacesEndpoint = new AWS.Endpoint("ams3.digitaloceanspaces.com");
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: Meteor.settings.private.spaces.ACCESS_KEY,
  secretAccessKey: Meteor.settings.private.spaces.SECRET_KEY,
});

// Spaces
let spacesFolder = "postrubella";
let spacesFolderParcelsPhoto =
  "postrubella/public/parcels-photos/" + moment().format("YYYY");

if (Meteor.absoluteUrl().includes("localhost")) {
  spacesFolder = "postrubella/tmp";
  spacesFolderParcelsPhoto =
    "postrubella/public/parcels-photos/dev/" + moment().format("YYYY");
}
if (Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")) {
  spacesFolder = "postrubella/tmp";
  spacesFolderParcelsPhoto =
    "postrubella/public/parcels-photos/dev/" + moment().format("YYYY");
}

(function () {
  if (!Meteor.isServer) {
    return;
  }
  Meteor.methods({
    /**
     *  Save to S3
     */

    // barcode
    "s3.barcode": async function (clientUniqueBarcode, todayPath) {
      check([clientUniqueBarcode, todayPath], [String]);
      try {
        QRCode.toDataURL(clientUniqueBarcode, (err, url) => {
          // convert base64 to binary
          const buf = Buffer.from(
            url.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
          );

          // params
          const params = {
            Body: buf,
            Bucket: `${spacesFolder}/barcodes/${todayPath}`,
            Key: `${clientUniqueBarcode}.png`,
            ContentType: "image/png",
            ContentEncoding: "base64",
            ACL: "public-read",
          };

          // Add a file to a Space
          s3.upload(params, (err, data) => {
            if (err) console.log(err, err.stack);
            // else     console.log(data);
          });

          // notify user
          // console.log('Success! Uploaded to S3.');
        });
      } catch (error) {
        console.log("S3 Error: ", error);
      }
    },

    // parcel photo
    "s3.parcelPhoto": async function (parcelPhoto, fileName) {
      check([parcelPhoto, fileName], [String]);
      var buf = Buffer.from(
        parcelPhoto.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      try {
        // params
        const params = {
          Body: buf,
          Bucket: `${spacesFolderParcelsPhoto}`,
          Key: `${fileName}`,
          ContentEncoding: "base64",
          ContentType: "image/jpeg",
          ACL: "public-read",
        };

        // Add a file to Space
        s3.upload(params, (err, data) => {
          if (err) console.log(err, err.stack);
        });
      } catch (error) {
        console.log("S3 Error: ", error);
      }
    },

    // signature
    "s3.signature": async (recipientSignature, firstParcel, todayPath) => {
      check([recipientSignature, firstParcel, todayPath], [String]);
      try {
        // convert base64 to binary
        const buf = Buffer.from(
          recipientSignature.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );

        // params
        const params = {
          Body: buf,
          Bucket: `${spacesFolder}/signatures/${todayPath}`,
          Key: `${firstParcel}.png`,
          ContentType: "image/png",
          ContentEncoding: "base64",
          ACL: "public-read",
        };

        // Add a file to a Space
        s3.upload(params, (err, data) => {
          if (err) console.log(err, err.stack);
          // else     console.log(data);
        });

        // notify user
        // console.log('Success! Uploaded to S3.');
      } catch (error) {
        console.log("S3 Error: ", error);
      }
    },
  });
})();
