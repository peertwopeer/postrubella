import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import moment from "moment-timezone";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import Paper from "@material-ui/core/Paper";
import Link from "@material-ui/core/Link";
import InfoIcon from "@material-ui/icons/Info";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";

import "/imports/languages/en/en.boxview.i18n.yml";
import "/imports/languages/en/en.inbound.i18n.yml";
import "/imports/languages/de/de.boxview.i18n.yml";
import "/imports/languages/de/de.boxview.i18n.yml";
import "/imports/languages/en-JM/en-JM.boxview.i18n.yml";
import "/imports/languages/en-JM/en-JM.inbound.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;

export default class SelectableParcelOffline extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: null,
    };
  }

  onSelected = () => {
    this.props.onChecked(this.props.parcel._id, this.selectable.checked);
  };

  renderQRCode() {
    if (!this.props.parcel.qrcode) return;

    return (
      <div className="block-qr-code">
        <a
          href={`/pdf/${this.props.parcel.clientUniqueBarcode}`}
          target="_blank"
        >
          <img src={this.props.parcel.qrcode} />
        </a>
      </div>
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

  scanThrough() {
    if (!this.props.parcel.xrayInput) return;
    if (this.props.parcel.xrayInput) {
      return (
        <div className="block-row">
          <b>{i18n.__("boxview.This item has been through an x-ray")} :</b>
          {i18n.__("boxview.Yes")}
        </div>
      );
    }
  }

  createdAt() {
    const { parcel } = this.props;

    if (parcel.offline)
      return (
        <div className="block-row">
          <b>{i18n.__("boxview.Received At")}:</b>
          {moment(this.props.parcel.offlineDate)
            .tz(this.props.timezone)
            .format("lll")}
        </div>
      );

    return (
      <div className="block-row">
        <b>{i18n.__("boxview.Received At")}:</b>
        {moment(this.props.parcel.createdAt)
          .tz(this.props.timezone)
          .format("lll")}
      </div>
    );
  }

  deliveryDateStatus() {
    if (
      !this.props.parcel.attemptedToDeliver &&
      this.props.parcel.deliveredAt == null
    ) {
      return <span>{i18n.__("boxview.undelivered")}</span>;
    }
    if (
      this.props.parcel.attemptedToDeliver &&
      this.props.parcel.deliveredAt == null
    ) {
      return (
        <span>
          {i18n.__("boxview.Attempted")} :{" "}
          {this.props.parcel.attemptedToDeliver.length}
        </span>
      );
    }
    if (this.props.parcel.deliveredAt !== null) {
      const deliveryDateStatus = moment(this.props.parcel.deliveredAt)
        .tz(this.props.timezone)
        .format("lll");

      return <span>{deliveryDateStatus}</span>;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // if parent component is true and child components are false
    if (nextProps.selectAll && !this.props.selectAll) {
      // tick all child components
      this.selectable.checked = nextProps.selectAll;
      // run function and add to bag
      this.onSelected();
      return true;
    }
    if (!nextProps.selectAll && this.props.selectAll) {
      // tick all child components
      this.selectable.checked = nextProps.selectAll;
      // run function and add to bag
      this.onSelected();
      return true;
    }
    return true;
  }

  renderDocOrEditDoc() {
    let deliveryStatus;
    let photoUrl = "";

    if (
      typeof this.props.parcel.photoName !== "undefined" &&
      this.props.parcel.photoName !== ""
    ) {
      if (
        Meteor.absoluteUrl().includes("localhost") ||
        Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")
      ) {
        photoUrl =
          "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/dev/" +
          moment(this.props.parcel.createdAt).format("YYYY") +
          "/" +
          this.props.parcel.photoName;
      } else {
        photoUrl =
          "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
          moment(this.props.parcel.createdAt).format("YYYY") +
          "/" +
          this.props.parcel.photoName;
      }
    }

    if (this.props.parcel.deliveredAt == null) {
      deliveryStatus = <org_placeholderTriangle className="recieved" />;
    } else {
      deliveryStatus = <org_placeholderTriangle className="delivered" />;
    }

    if (this.state.editing === null) {
      return (
        <div className="block block-parcel md-col-6 lg-col-4">
          <Paper elevation={3} className="block-paper">
            <div
              style={{ minHeight: "500px" }}
              className="block-content clearix"
            >
              <div className="inside">
                <div className="parcel-select">
                  <input
                    type="checkbox"
                    ref={(input) => {
                      this.selectable = input;
                    }}
                    className="checkbox"
                    defaultChecked={this.props.checked}
                    name="selectParcel"
                    value={this.props.parcel._id}
                    onClick={this.onSelected}
                  />
                </div>

                <div className="block-title barcode">
                  {this.props.parcel.clientUniqueBarcode}
                </div>

                {/*{ this.renderQRCode() }*/}

                <div className="block-body">
                  <div className="block-row">
                    <b>{i18n.__("boxview.Post")}:</b>
                    {this.props.parcel.type}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Barcode")}:</b>
                    {this.props.parcel.barcode ||
                      this.props.parcel.clientUniqueBarcode}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Carrier")}:</b>
                    {this.props.parcel.carrier}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Sender")}:</b>
                    {this.props.parcel.sender}
                  </div>
                  <div
                    hidden={this.props.parcel.destination ? false : true}
                    className="block-row"
                  >
                    <b>{i18n.__("boxview.Destination")}:</b>
                    {this.props.parcel.destination}
                  </div>
                  <div
                    hidden={
                      this.props.parcel.lastProcessed && this.props.parcel._id
                        ? false
                        : true
                    }
                    className="block-row"
                  >
                    <b>{i18n.__("boxview.Last Processed")}:</b>
                    <p>
                      {this.props.parcel.lastProcessed}{" "}
                      <Link
                        href=""
                        color="initial"
                        underline="none"
                        onClick={() =>
                          FlowRouter.go(
                            "/view-parcel-details?parcelId=" +
                              this.props.parcel._id
                          )
                        }
                      >
                        <InfoIcon fontSize="inherit" />
                      </Link>
                    </p>
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Post Instructions")}:</b>
                    {this.props.parcel.deliveryUser}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Location/Company")}:</b>
                    {this.props.parcel.location}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Recipient / Addressee")}:</b>
                    {this.renderRecipientName()}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Type")}:</b>
                    {this.props.parcel.deliveryType}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Number of Items")}:</b>
                    {this.props.parcel.numberOfItems}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Delivered At")}:</b>
                    {this.deliveryDateStatus()}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Outbound Address")}:</b>
                    {this.props.parcel.outboundAddress}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("common.Assign user")}:</b>
                    {this.props.parcel.assignUser}
                  </div>
                  {this.scanThrough()}
                  {photoUrl !== "" ? (
                    <div className="block-row">
                      <b>{i18n.__("common.Photo URL")}:</b>
                      <button
                        onClick={() =>
                          FlowRouter.go("/view-image-file?photoUrl=" + photoUrl)
                        }
                      >
                        {" "}
                        <span
                          style={{
                            color: "#4da6ff",
                            textDecoration: "underline",
                          }}
                        >
                          Click here to show image file
                        </span>{" "}
                      </button>
                    </div>
                  ) : (
                    ""
                  )}
                </div>

                <div className="block-notes">
                  <div className="block-icon">
                    <img src={`${publicDir}/svg/IconClipboard.svg`} />
                  </div>
                  {this.props.parcel.notes}
                </div>
              </div>
            </div>
            <div className="block-status clearix" />
            <div className="block-meta clearix">
              <div className="inside">
                <div className="block-meta-text">
                  <div className="block-row">
                    <b>{i18n.__("common.Received By")}</b>
                    {this.props.parcel.username}
                  </div>
                  {this.createdAt()}
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
      );
    }
  }

  render() {
    return this.renderDocOrEditDoc();
  }
}
SelectableParcelOffline.propTypes = {
  parcel: PropTypes.object.isRequired,
  checked: PropTypes.bool,
  onChecked: PropTypes.func,
  isGroupClient: PropTypes.bool,
};
SelectableParcelOffline.defaultProps = {
  checked: false,
};
