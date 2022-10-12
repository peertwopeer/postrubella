import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import moment from "moment-timezone";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";

import "/imports/languages/en/en.report.i18n.yml";
import "/imports/languages/en-JM/en-JM.report.i18n.yml";

export default class ParcelDeliveredRow extends Component {
  renderBarcode() {
    if (this.props.parcel.barcode) {
      return (
        <div>
          {this.props.parcel.clientUniqueBarcode}
          <br />( {this.props.parcel.barcode} )
        </div>
      );
    }

    return <div>{this.props.parcel.clientUniqueBarcode}</div>;
  }

  deliveryDateStatus() {
    if (
      !this.props.parcel.attemptedToDeliver &&
      this.props.parcel.deliveredAt == null
    ) {
      return <div>{i18n.__("report.Undelivered")}</div>;
    }
    if (
      this.props.parcel.attemptedToDeliver &&
      this.props.parcel.deliveredAt == null
    ) {
      return (
        <div>
          {i18n.__("report.Attempted")}:{" "}
          {this.props.parcel.attemptedToDeliver.length}{" "}
        </div>
      );
    }
    if (this.props.parcel.deliveredAt !== null) {
      const deliveryDateStatus = moment(this.props.parcel.deliveredAt)
        .tz(this.props.timezone)
        .format("lll");

      return <div>{deliveryDateStatus}</div>;
    }
  }

  showSignature() {
    if (!this.props.parcel.deliveredAt) {
      return <div onClick={this.getSig}>{i18n.__("report.No")}</div>;
    }

    return <div onClick={this.getSig}>{i18n.__("report.Yes")}</div>;
  }

  getSig = () => {
    Meteor.call("fetchSignature");
  };

  renderRecipientName() {
    if (this.props.parcel.recipientInboundName) {
      return <div>( {this.props.parcel.recipientInboundName} )</div>;
    }
    if (this.props.parcel.outboundRecipient) {
      return <div>( {this.props.parcel.outboundRecipient} )</div>;
    }
    if (!this.props.parcel.recipientInboundName) {
      return <div>{this.props.parcel.recipientName}</div>;
    }
    if (!this.props.parcel.outboundRecipient) {
      return <div>{this.props.parcel.recipientName}</div>;
    }
  }

  renderSignee() {
    if (this.props.parcel.signee) {
      return <div>{this.props.parcel.signee}</div>;
    }
  }

  receivedAt() {
    const { parcel } = this.props;
    const formatTimeDate = (date) =>
      moment(date).tz(this.props.timezone).format("lll");
    return formatTimeDate(parcel.offlineDate || parcel.createdAt);
  }

  render() {
    const deliveryStatus =
      this.props.parcel.deliveredAt == null
        ? i18n.__("report.recieved")
        : i18n.__("report.delivered");

    let xraystatus = "No";
    if (this.props.parcel.xrayInput) {
      xraystatus = "Yes";
    }

    return (
      <tr>
        <td className="delivery-status">
          <org_placeholderTriangle className={deliveryStatus} />
        </td>
        <td>{this.renderBarcode()}</td>
        <td>{this.props.parcel.carrier}</td>
        <td>{this.props.parcel.sender}</td>
        <td>{this.props.parcel.deliveryType}</td>
        <td>{this.props.parcel.deliveryUser}</td>
        <td>{this.props.parcel.location}</td>
        <td>{this.renderRecipientName()}</td>
        <td>{this.renderSignee()}</td>
        <td>{this.showSignature()}</td>
        <td>{this.receivedAt()}</td>
        <td>{this.props.parcel.username}</td>
        <td>{this.props.parcel.numberOfItems}</td>
        <td>{this.deliveryDateStatus()}</td>
        <td>{this.props.parcel.deliveredByUsername}</td>
        <td>{this.props.parcel.outboundAddress}</td>
        <td>{this.props.parcel.notes}</td>
        <td>{xraystatus}</td>
        <td>{this.props.parcel.assignUser}</td>
      </tr>
    );
  }
}

ParcelDeliveredRow.propTypes = {
  parcel: PropTypes.object.isRequired,
};
