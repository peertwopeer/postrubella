import request from "request";
import { Parcels } from "./parcels";

if (!Meteor.isServer) {
  return;
}
Picker.route("/pdf/:clientUniqueBarcode", (params, req, res, next) => {
  const clientUniqueBarcode = params.clientUniqueBarcode;
  const parcel = clientUniqueBarcode
    ? Parcels.findOne({ clientUniqueBarcode })
    : null;

  if (!parcel) {
    res.setHeader("Content-Type", "text/html");
    res.statusCode = 404;
    res.end("Parcel not found");

    return;
  }

  const outboundAddress =
    parcel.outboundRecipient !== undefined ? parcel.outboundAddress : "";
  const { outboundRecipient = "" } = parcel;

  const html = `<div style="margin-top:50px; padding:30px; border: 2px solid #000;">

                      <div style="margin-bottom:2px; text-align:center; font-size: 16px; text-transform:uppercase; font-weight:bold;">${outboundRecipient}</div>
                      <div style="margin-bottom:20px; text-align:center; font-size: 16px; text-transform:uppercase; font-weight:bold;">${outboundAddress}</div>

                      <div style="margin-bottom:5px; text-align:center; font-size: 14px; text-transform:uppercase; line-height:13px;">${parcel.clientUniqueBarcode} - ${parcel.type}</div>
                      
                      <div style="margin-bottom:2px; text-align:center; font-size: 14px; text-transform:uppercase; font-weight:normal;">${parcel.carrier} - ${parcel.location}</div>                        

                      <div style="margin:0 0 5px;"><img style="width:100%; height:auto;" src="${parcel.qrcode}" /></div>
                      <div><img style="width:100%; height:auto;" src="https://postrubella.ams3.digitaloceanspaces.com/public/svg/Logopostrubella.svg"/></div>
                    </div>
                    `;

  request(
    {
      uri: "http://138.68.170.61:9010",
      method: "POST",
      json: { html },
      encoding: null,
      headers: {
        "x-pdf-pageSize": "A5",
      },
    },
    (error, response, body) => {
      res.setHeader("Content-Type", "application/pdf");
      res.statusCode = 200;
      res.end(body);
    }
  );
});
