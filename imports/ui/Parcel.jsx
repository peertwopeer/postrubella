import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import moment from "moment-timezone";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Link from "@material-ui/core/Link";
import InfoIcon from "@material-ui/icons/Info";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";
import { Parcels } from "/imports/api/parcels.js";

import "/imports/languages/en/en.common.i18n.yml";
import "/imports/languages/de/de.common.i18n.yml";
import "/imports/languages/en-JM/en-JM.common.i18n.yml";
import "/imports/languages/en/en.boxview.i18n.yml";
import "/imports/languages/de/de.boxview.i18n.yml";
import "/imports/languages/en-JM/en-JM.boxview.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;

export default class Parcel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: null,
      parcelCarrierValue: this.props.parcel.carrier,
      parcelDeliveryTypeValue: this.props.parcel.deliveryType,
      parcelLocationValue: this.props.parcel.location,
      parcelNumberOfItemsValue: this.props.parcel.numberOfItems,
    };
  }

  handleParcelCarrierChange = (event) => {
    this.setState({ parcelCarrierValue: event.target.value });
  };
  handleparcelDeliveryTypeChange = (event) => {
    this.setState({ parcelDeliveryTypeValue: event.target.value });
  };
  handleParcelLocationChange = (event) => {
    this.setState({ parcelLocationValue: event.target.value });
  };
  handleParcelNumberOfItemsChange = (event) => {
    this.setState({ parcelNumberOfItemsValue: event.target.value });
  };
  toggleEditing = () => {
    this.setState({ editing: this.props.parcel._id });
  };
  cancelEditing = () => {
    this.setState({ editing: null });
  };

  handleSubmit = (event) => {
    event.preventDefault();

    const parcelID = this.state.editing;
    const carrier = this.parcelCarrier.value.trim();
    const location = this.parcelDeliveryType.value.trim();
    const deliveryType = this.parcelLocation.value.trim();
    const numberOfItems = this.parcelNumberOfItems.value.trim();

    if (carrier.length <= 2) return;
    if (deliveryType.length <= 2) return;
    if (deliveryType.length <= 2) return;
    // @todo: implement correct working method
    // Meteor.call('parcels.update', location, carrier, deliveryType, numberOfItems, updatedAt, function(err, result) {
    // if(result) {
    // this.setState({ editing: null });
    // }
    // })
    Parcels.update(parcelID, {
      $set: {
        location,
        carrier,
        deliveryType,
        numberOfItems,
        updatedAt: new Date(),
      },
    });
    this.setState({ editing: null });
  };

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

  scanThrough() {
    if (!this.props.parcel.xrayInput) return;
    if (this.props.parcel.xrayInput) {
      return (
        <div className="block-row">
          <b>{i18n.__("boxview.This item has been through an x-ray")}:</b>
          {i18n.__("boxview.Yes")}
        </div>
      );
    }
  }

  renderBarcode() {
    if (!this.props.parcel.clientUniqueBarcode) {
      return <span>{this.props.parcel._id}</span>;
    }

    return <span>{this.props.parcel.clientUniqueBarcode}</span>;
  }

  renderDocOrEditDoc() {
    let deliveryStatus;
    const clickedID = this.props.parcel._id;
    const width = this.props.width ? this.props.width : "md-col-6 lg-col-4";

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
    if (this.state.editing === clickedID) {
      return (
        <div className={`block block-parcel-${width}`}>
          <Paper elevation={3} className="block-paper">
            <div className="block-content clearix">
              <div className="inside">
                <div className="block-title barcode">
                  {this.renderBarcode()}
                </div>

                <div className="block-body">
                  <div className="block-row">
                    <div className="form-row">
                      <div className="form-row-label">
                        {i18n.__("boxview.Carrier")}:
                      </div>

                      <input
                        type="text"
                        ref={(c) => {
                          this.parcelCarrier = c;
                        }}
                        placeholder={i18n.__("boxview.Carrier")}
                        value={this.state.parcelCarrierValue}
                        onChange={this.handleParcelCarrierChange}
                      />
                    </div>
                  </div>
                  <div className="block-row">
                    <div className="form-row">
                      <div className="form-row-label">
                        {i18n.__("boxview.Type")}:
                      </div>

                      <input
                        type="text"
                        ref={(c) => {
                          this.parcelDeliveryType = c;
                        }}
                        placeholder={i18n.__("boxview.Type")}
                        value={this.state.parcelDeliveryTypeValue}
                        onChange={this.handleparcelDeliveryTypeChange}
                      />
                    </div>
                  </div>
                  <div className="block-row mb2">
                    <div className="form-row">
                      <div className="form-row-label">
                        {i18n.__("boxview.Company")}:
                      </div>
                      <input
                        type="text"
                        ref={(c) => {
                          this.parcelLocation = c;
                        }}
                        placeholder={i18n.__("boxview.Company")}
                        value={this.state.parcelLocationValue}
                        onChange={this.handleParcelLocationChange}
                      />
                    </div>
                  </div>

                  <div className="block-row mb2">
                    <div className="form-row">
                      <div className="form-row-label">
                        {i18n.__("boxview.Number of Items")}:
                      </div>
                      <input
                        type="number"
                        ref={(c) => {
                          this.parcelNumberOfItems = c;
                        }}
                        placeholder={i18n.__("boxview.Number of Items")}
                        value={this.state.parcelNumberOfItemsValue}
                        onChange={this.handleParcelNumberOfItemsChange}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={this.handleSubmit}
                    variant="contained"
                    color="primary"
                    fullWidth={true}
                  >
                    {i18n.__("common.Update")}
                  </Button>
                </div>
              </div>
            </div>
            <div className="block-status clearix" />
            <div className="block-meta clearix">
              <div className="inside">
                <div className="block-meta-text">
                  <div className="block-row">
                    <b>{i18n.__("common.Received By")}:</b>
                    {this.props.parcel.username}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("common.Received At")}:</b>
                    {moment(this.props.parcel.createdAt)
                      .tz(this.props.timezone)
                      .format("lll")}
                  </div>
                </div>
                <div className="block-meta-links">
                  <div className="left">
                    <div className="delivery-status">{deliveryStatus}</div>
                  </div>
                  <div className="block-icon" onClick={this.cancelEditing}>
                    <img src={`${publicDir}/svg/IconSettings.svg`} />
                  </div>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      );
    }
    if (this.state.editing === null) {
      return (
        <div className={`block block-parcel-${width}`}>
          <Paper elevation={3} className="block-paper">
            <div className="block-content clearix">
              <div className="inside">
                <div className="block-title barcode">
                  {this.renderBarcode()}
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
                  <div
                    hidden={this.props.parcel.sender ? false : true}
                    className="block-row"
                  >
                    <b>{i18n.__("boxview.Sender")}:</b>
                    {this.props.parcel.sender}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Action")}:</b>
                    {this.props.parcel.deliveryUser}
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
                    <b>{i18n.__("boxview.Location/Company")}:</b>
                    {this.props.parcel.location}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Recipient / Addressee")}:</b>
                    {this.props.parcel.recipientName}
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
                    <b>{i18n.__("boxview.Outbound Address")}:</b>
                    {this.props.parcel.outboundAddress != "" &&
                    typeof this.props.parcel.outboundAddress != "undefined" &&
                    this.props.parcel.outboundAddress != undefined &&
                    this.props.parcel.outboundAddress != null
                      ? this.props.parcel.outboundAddress
                      : "N/A"}
                  </div>
                  {this.scanThrough()}
                  {photoUrl !== "" ? (
                    <div className="block-row">
                      <b>{i18n.__("common.Photo URL")}:</b>
                      {window.cordova ? (
                        <button
                          onClick={() =>
                            FlowRouter.go(
                              "/view-image-file?photoUrl=" + photoUrl
                            )
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
                      ) : (
                        <a href={photoUrl} target="_blank">
                          {" "}
                          Click here to open image file
                        </a>
                      )}
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
                    <b>{i18n.__("common.Received By")}:</b>
                    {this.props.parcel.username}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("common.Received At")}:</b>
                    {moment(this.props.parcel.createdAt)
                      .tz(this.props.timezone)
                      .format("lll")}
                  </div>
                </div>

                <div className="block-meta-links">
                  <div className="left">
                    <div className="delivery-status">{deliveryStatus}</div>
                  </div>
                  {/* <div className="block-icon" onClick={ this.toggleEditing }> */}
                  {/* <img src={ `${publicDir}/svg/IconSettings.svg` }/> */}
                  {/* </div> */}
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
Parcel.propTypes = {
  parcel: PropTypes.object.isRequired,
};
