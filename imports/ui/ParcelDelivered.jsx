import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import moment from "moment-timezone";
import Paper from "@material-ui/core/Paper";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";

import "/imports/languages/en/en.report.i18n.yml";
import "/imports/languages/en-JM/en-JM.report.i18n.yml";
export default class ParcelDelivered extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recipientSignature: null,
    };
  }

  renderUniqueBarcode() {
    return (
      <span>
        {this.props.parcel.clientUniqueBarcode || this.props.parcel._id}
      </span>
    );
  }
  renderQRCode() {
    if (!this.props.parcel.qrcode) return;

    return (
      <div className="block-qr-code">
        <a
          href={`/pdf/${this.props.parcel.clientUniqueBarcode}`}
          target="_blank"
        >
          <img src={this.props.parcel.qrcode} role="presentation" />
        </a>
      </div>
    );
  }
  attemptedDelivery() {
    if (
      !this.props.parcel.deliveredAt &&
      this.props.parcel.attemptedToDeliver
    ) {
      const attemptedToDeliverCount =
        this.props.parcel.attemptedToDeliver.length;

      return (
        <div className="block-row">
          <b>{i18n.__("report.Attempted Delivery")}: </b>{" "}
          {attemptedToDeliverCount}
        </div>
      );
    } else {
      return (
        <div className="block-row">
          <b>{i18n.__("report.Attempted Delivery")}: </b>{" "}
          {i18n.__("report.NIL")}
        </div>
      );
    }
  }

  getSignature = () => {
    // Get parcel ID from props
    const parcelId = this.props.parcel._id;

    // Go to server and Grab the parcel props
    Meteor.call("getSignature", parcelId, (error, result) => {
      // empty
      // error
      if (error) {
        return console.log("Error: ", error);
      }

      if (result) {
        const { recipientSignature } = result[0];
        if (recipientSignature !== undefined) {
          this.setState({
            recipientSignature,
          });
        }
      }
    });
  };

  displaySignature() {
    if (this.props.parcel.recipientSignatureImage) {
      return (
        <span>
          <img
            alt="Signature"
            src={this.props.parcel.recipientSignatureImage}
            role="presentation"
          />
        </span>
      );
    }
    if (this.state.recipientSignature !== null) {
      return (
        <span>
          <img alt="Signature" src={this.state.recipientSignature} />
        </span>
      );
    }
    //if signature not loaded
    return (
      <span onClick={this.getSignature}>
        {" "}
        {i18n.__("report.No signature found")}
        <br />
        {i18n.__("report.Click here to recheck")}
      </span>
    );
  }

  renderRecipientName() {
    if (this.props.parcel.recipientInboundName) {
      return <span>( {this.props.parcel.recipientInboundName} )</span>;
    }
    if (this.props.parcel.outboundRecipient) {
      return <span>( {this.props.parcel.outboundRecipient} )</span>;
    }
    if (!this.props.parcel.recipientInboundName) {
      return <span>{this.props.parcel.recipientName}</span>;
    }
    if (!this.props.parcel.outboundRecipient) {
      return <span>{this.props.parcel.recipientName}</span>;
    }
  }

  renderBarcode() {
    return (
      <div className="block-row">
        <b>{i18n.__("report.Barcode")}:</b>
        {this.props.parcel.barcode || this.props.parcel.clientUniqueBarcode}
      </div>
    );
  }

  renderType() {
    if (!this.props.postType) {
      return (
        <div className="block-row">
          <b>{this.props.parcel.type.toUpperCase()}</b>
        </div>
      );
    }
  }

  renderPostman() {
    if (this.props.parcel.type === "inbound") {
      return (
        <div className="block-row">
          <b>{i18n.__("report.Action")}:</b>
          {this.props.parcel.deliveryUser}
        </div>
      );
    }
  }

  renderReceivedAt() {
    const { offlineDate, createdAt } = this.props.parcel;

    return (
      <div className="block-row">
        <b>{i18n.__("report.Received At")}:</b>
        {moment(offlineDate || createdAt)
          .tz(this.props.timezone)
          .format("lll")}
      </div>
    );
  }

  renderReceivedBy() {
    return (
      <div className="block-row">
        <b>{i18n.__("report.Received By")}:</b> {this.props.parcel.username}
      </div>
    );
  }

  renderSender() {
    if (this.props.parcel.type === "inbound") {
      return (
        <div className="block-row">
          <b>{i18n.__("report.Sender")}:</b>
          {this.props.parcel.sender}
        </div>
      );
    }
  }

  renderOutboundAddress() {
    if (this.props.parcel.type === "outbound") {
      return (
        <div className="block-row">
          <b>{i18n.__("report.Outbound Address")}:</b>
          {this.props.parcel.outboundAddress}
        </div>
      );
    }
  }

  renderDeliveredAt() {
    if (this.props.parcel.deliveredAt) {
      const deliveryDateStatus = moment(this.props.parcel.deliveredAt)
        .tz(this.props.timezone)
        .format("lll");

      return (
        <div className="block-row">
          <b>{i18n.__("report.Delivered At")}:</b> {deliveryDateStatus}
        </div>
      );
    } else {
      return (
        <div className="block-row">
          <b>{i18n.__("report.Delivered At")}:</b>
          {i18n.__("report.NIL")}
        </div>
      );
    }
  }

  renderDeliveredBy() {
    if (this.props.parcel.deliveredAt) {
      return (
        <div className="block-row">
          <b>{i18n.__("report.Delivered By")}:</b>{" "}
          {this.props.parcel.deliveredByUsername}
        </div>
      );
    } else {
      return (
        <div className="block-row">
          <b>{i18n.__("report.Delivered By")}:</b>
          {i18n.__("report.NIL")}
        </div>
      );
    }
  }

  renderNotes() {
    const { notes } = this.props.parcel;

    if (notes) {
      return (
        <div className="block-row">
          <b>{i18n.__("report.Notes")}:</b> {notes}
        </div>
      );
    } else {
      return <br></br>;
    }
  }

  renderPassthroughxray() {
    const { xrayInput } = this.props.parcel;

    if (xrayInput) {
      return (
        <div className="block-row">
          <b>{i18n.__("report.This item has been through an x-ray")}:</b>{" "}
          {i18n.__("report.Yes")}
        </div>
      );
    } else {
      return (
        <div className="block-row">
          <b>{i18n.__("report.This item has been through an x-ray")}:</b>{" "}
          {i18n.__("report.No")}
        </div>
      );
    }
  }

  renderSignee() {
    if (this.props.parcel.deliveredAt) {
      return (
        <div>
          <b>{i18n.__("report.Signee")}:</b> {this.props.parcel.signee}
        </div>
      );
    }
  }

  render() {
    const { parcel } = this.props;
    let deliveryStatus;
    let photoUrl = "";

    if (typeof parcel.photoName !== "undefined" && parcel.photoName !== "") {
      if (
        Meteor.absoluteUrl().includes("localhost") ||
        Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")
      ) {
        photoUrl =
          "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/dev/" +
          moment(parcel.createdAt).format("YYYY") +
          "/" +
          parcel.photoName;
      } else {
        photoUrl =
          "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
          moment(parcel.createdAt).format("YYYY") +
          "/" +
          parcel.photoName;
      }
    }

    if (parcel.deliveredAt == null) {
      deliveryStatus = <org_placeholderTriangle className="recieved" />;
    } else {
      deliveryStatus = <org_placeholderTriangle className="delivered" />;
    }

    return (
      <div>
        <div className="block block-parcel md-col-6 lg-col-4">
          <Paper elevation={3} className="block-paper">
            <div
              style={{ minHeight: "600px" }}
              className="block-content clearix"
            >
              <div className="inside">
                <div className="block-title barcode boxHeadingWrap">
                  {this.renderUniqueBarcode()}
                </div>

                {this.renderQRCode()}

                <div className="block-body">
                  {this.renderType()}
                  {this.renderPostman()}
                  {this.renderReceivedAt()}
                  {this.renderReceivedBy()}
                  {this.renderBarcode()}
                  <div className="block-row">
                    <b>{i18n.__("report.Carrier")}:</b>
                    {parcel.carrier}
                  </div>
                  {this.renderSender()}
                  <div className="block-row">
                    <b>{i18n.__("report.Location/Company")}:</b>
                    {parcel.location}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("report.Recipient / Addressee")}:</b>
                    {this.renderRecipientName()}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("report.Delivery Type")}:</b>
                    {parcel.deliveryType}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("common.Assign user")}:</b>
                    {parcel.assignUser}
                  </div>
                  {this.renderOutboundAddress()}
                  {this.renderDeliveredAt()}
                  {this.renderDeliveredBy()}
                  {this.attemptedDelivery()}
                  <div className="block-row">
                    <b>{i18n.__("report.Number of Items")}:</b>
                    {parcel.numberOfItems}
                  </div>
                  {this.renderNotes()}
                  {this.renderPassthroughxray()}
                  {photoUrl !== "" ? (
                    <div className="block-row">
                      <b>{i18n.__("common.Photo URL")}:</b>{" "}
                      <a href={photoUrl} target="_blank">
                        {" "}
                        Click here to open image file{" "}
                      </a>
                    </div>
                  ) : (
                    ""
                  )}
                </div>
                <div className="block-recipient">
                  {this.props.parcel.deliveredAt ? (
                    <div className="block-recipient-signature">
                      {this.displaySignature()}
                    </div>
                  ) : (
                    ""
                  )}

                  <div className="block-recipient-name">
                    {this.renderSignee()}
                  </div>
                </div>
              </div>
            </div>
            <div className="block-status clearix" />
            <div className="block-meta clearix">
              <div className="inside">
                <div className="block-meta-text">
                  <div className="block-row">
                    <b>{i18n.__("report.Received By")}:</b>
                    {parcel.username}
                  </div>
                </div>
                <div className="block-meta-links">
                  <div className="left">
                    <div className="delivery-status">{deliveryStatus}</div>
                  </div>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      </div>
    );
  }
}
// props
ParcelDelivered.propTypes = {
  parcel: PropTypes.object.isRequired,
};
