import React from "react";
import moment from "moment";
import Step from "@material-ui/core/Step";
import Paper from "@material-ui/core/Paper";
import Stepper from "@material-ui/core/Stepper";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";

const publicDir = `${Meteor.settings.public.cdn}/public`;

const TrackParcel = (props) => {
  const [parcelLogs, setParcelLogs] = React.useState([]);
  const [parcelStatus, setParcelStatus] = React.useState("");
  const [logReady, setLogReady] = React.useState(false);
  const [parcel, setParcel] = React.useState([]);
  const [parcelReady, setParcelReady] = React.useState(false);

  // component did mount
  React.useEffect(() => {
    let unMounted = false;
    Meteor.call("parcels.getParcelDetails", props.parcelId, function (error, result) {
      if (error) {
        console.log(error);
      } else {
        setParcel(result);
        setParcelReady(true);
      }
    });
    Meteor.call("parcels.getParcelLogs", props.parcelId, function (error, response) {
      if (error) {
        console.log(error);
      } else {
        setParcelLogs(response.track);
        setParcelStatus(response.status);
        setLogReady(true);
      }
    });
    return () => (unMounted = true);
  }, []);

  renderRecipientName = (parcel) => {
    if (parcel.recipientInboundName) {
      return <span>( {parcel.recipientInboundName} )</span>;
    }
    if (parcel.outboundRecipient) {
      return <span>( {parcel.outboundRecipient} )</span>;
    }
    if (!parcel.recipientInboundName) {
      return <span>{parcel.recipientName}</span>;
    }
    if (!parcel.outboundRecipient) {
      return <span>{parcel.recipientName}</span>;
    }
  };
  deliveryDateStatus = (parcel) => {
    if (!parcel.attemptedToDeliver && parcel.deliveredAt == null) {
      return <span>{i18n.__("boxview.undelivered")}</span>;
    }
    if (parcel.attemptedToDeliver && parcel.deliveredAt == null) {
      return (
        <span>
          {i18n.__("boxview.Attempted")} : {parcel.attemptedToDeliver.length}
        </span>
      );
    }
    if (parcel.deliveredAt !== null) {
      const deliveryDateStatus = moment(parcel.deliveredAt).format("Do MMMM YYYY, h:mm A");

      return <span>{deliveryDateStatus}</span>;
    }
  };
  return (
    <>
      {logReady && parcelReady ? (
        <div className="container">
          <div className="clearfix capitalize">
            <div className="col sm-col-12 md-col-6 p2">
              <Stepper orientation="vertical">
                {parcelLogs?.map((value, index, array) => (
                  <Step key={index} completed={index + 1 !== array.length || parcelStatus == "delivered"} active={true}>
                    <StepLabel StepIconProps={{ icon: "" }}>
                      <b className="text-dark">{index + 1 === array.length ? parcelStatus : index == 0 ? "Created" : "Sorted"}</b>
                    </StepLabel>
                    <StepContent>
                      <Paper elevation={3}>
                        <div className="block">
                          <div className="block-content clearix">
                            <div className="inside">
                              <div className="block-title medium">{value.clientName}</div>
                            </div>
                          </div>
                          <div className="block-status clearix" />
                          <div className="block-status clearix" />
                          <div className="block-meta clearix">
                            <div className="inside">
                              <div className="block-meta-text">
                                <div className="block-row">
                                  <b>{moment(value.time).format("Do MMMM YYYY, h:mm A")}</b>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Paper>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </div>
            <div className="col sm-col-12 md-col-6 p2">
              <br />
              {window.innerWidth > 830 ? (
                <Paper elevation={3} className="block-paper mt-30">
                  <div className="block-content clearix">
                    <div className="inside">
                      <div className="block-title barcode">{parcel.clientUniqueBarcode}</div>
                      <div className="block-body">
                        <div className="block-row">
                          <b>{i18n.__("boxview.Post")}:</b>
                          {parcel.type}
                        </div>
                        <div className="block-row">
                          <b>{i18n.__("boxview.Barcode")}:</b>
                          {parcel.barcode || parcel.clientUniqueBarcode}
                        </div>
                        <div className="block-row">
                          <b>{i18n.__("boxview.Carrier")}:</b>
                          {parcel.carrier}
                        </div>
                        <div className="block-row">
                          <b>{i18n.__("boxview.Sender")}:</b>
                          {parcel.sender}
                        </div>
                        <div hidden={parcel.destination ? false : true} className="block-row">
                          <b>{i18n.__("boxview.Destination")}:</b>
                          {parcel.destination}
                        </div>
                        <div hidden={parcel.lastProcessed ? false : true} className="block-row">
                          <b>{i18n.__("boxview.Last Processed")}:</b>
                          {parcel.lastProcessed}
                        </div>
                        <div className="block-row">
                          <b>{i18n.__("boxview.Post Instructions")}:</b>
                          {parcel.deliveryUser}
                        </div>
                        <div className="block-row">
                          <b>{i18n.__("boxview.Location/Company")}:</b>
                          {parcel.location}
                        </div>
                        <div className="block-row">
                          <b>{i18n.__("boxview.Recipient / Addressee")}:</b>
                          {this.renderRecipientName(parcel)}
                        </div>
                        <div className="block-row">
                          <b>{i18n.__("boxview.Type")}:</b>
                          {parcel.deliveryType}
                        </div>
                        <div className="block-row">
                          <b>{i18n.__("boxview.Number of Items")}:</b>
                          {parcel.numberOfItems}
                        </div>
                        <div className="block-row">
                          <b>{i18n.__("boxview.Outbound Address")}:</b>
                          {parcel.outboundAddress}
                        </div>
                      </div>

                      <div className="block-notes">
                        <div className="block-icon">
                          <img src={`${publicDir}/svg/IconClipboard.svg`} />
                        </div>
                        {parcel.notes}
                      </div>
                    </div>
                  </div>
                  <div className="block-status clearix" />
                  <div className="block-status clearix" />
                  <div className="block-meta clearix">
                    <div className="inside">
                      <div className="block-meta-text">
                        <div className="block-row">
                          <b>{i18n.__("common.Received By")}</b>
                          {parcel.username}
                        </div>
                        <div className="block-row">
                          <b>{i18n.__("common.Received At")}</b>
                          {moment(parcel.createdAt).format("Do MMMM YYYY, h:mm A")}
                        </div>
                      </div>

                      <div className="block-meta-links">
                        <div className="left">
                          <div className="delivery-status">{parcel.deliveryStatus}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Paper>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="simple-loader">
            <img src={`${publicDir}/img/loading.gif`} />
          </div>
          <div className="data-processing-message">
            <br></br>
            <b>{i18n.__("common.The data is loading please wait")}</b>
          </div>
        </div>
      )}
    </>
  );
};

export default TrackParcel;
