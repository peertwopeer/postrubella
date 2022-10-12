import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import moment from "moment-timezone";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import Link from "@material-ui/core/Link";
import InfoIcon from "@material-ui/icons/Info";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";

import "/imports/languages/en/en.report.i18n.yml";
import "/imports/languages/de/de.report.i18n.yml";
import "/imports/languages/en-JM/en-JM.report.i18n.yml";

// Parcel component - represents a single item
export default class SelectableParcel extends Component {
  onSelected = () => {
    this.props.onChecked(this.props.parcel._id, this.selectable.checked);
  };

  deliveryDateStatus() {
    if (
      !this.props.parcel.attemptedToDeliver &&
      this.props.parcel.deliveredAt == null
    ) {
      return <span>{i18n.__("report.Undelivered")}</span>;
    }
    if (
      this.props.parcel.attemptedToDeliver &&
      this.props.parcel.deliveredAt == null
    ) {
      return (
        <span>
          {i18n.__("report.Attempted")}:{" "}
          {this.props.parcel.attemptedToDeliver.length}
        </span>
      );
    }
    if (this.props.parcel.deliveredAt !== null) {
      const formatTimeDate = (date) =>
        moment(date).tz(this.props.timezone).format("lll");
      const deliveryDateStatus = formatTimeDate(this.props.parcel.deliveredAt);

      return <span>{deliveryDateStatus}</span>;
    }
  }

  renderBarcode() {
    if (this.props.parcel.barcode) {
      return (
        <span>
          {this.props.parcel.clientUniqueBarcode}
          <br />( {this.props.parcel.barcode} )
        </span>
      );
    }

    return <span>{this.props.parcel.clientUniqueBarcode}</span>;
  }

  showSignature() {
    if (!this.props.parcel.deliveredAt) {
      return <td onClick={this.getSig}>{i18n.__("report.No")}</td>;
    }

    return <td onClick={this.getSig}>{i18n.__("report.Yes")}</td>;
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

  createdAt() {
    const { parcel } = this.props;
    const formatTimeDate = (date) =>
      moment(date).tz(this.props.timezone).format("lll");
    return formatTimeDate(
      parcel.offline ? parcel.offlineDate : parcel.createdAt
    );
  }

  render() {
    // deliveryStatus
    let deliveryStatus;

    if (this.props.parcel.deliveredAt == null) {
      deliveryStatus = <org_placeholderTriangle className="recieved" />;
    } else {
      deliveryStatus = <org_placeholderTriangle className="delivered" />;
    }

    let xraystatus = "-";
    if (this.props.parcel.xrayInput) {
      xraystatus = i18n.__("report.Yes");
    }

    return (
      <tr>
        <td className="delivery-status">{deliveryStatus}</td>
        <td>
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
        </td>
        <td>{this.renderBarcode()}</td>
        <td>{this.props.parcel.carrier}</td>
        <td>{this.props.parcel.sender}</td>
        <td>{this.props.parcel.deliveryUser}</td>
        {this.props.isGroupClient == true ? (
          <>
            {this.props.parcel.destination ? (
              <td>{this.props.parcel.destination}</td>
            ) : (
              <td> </td>
            )}
            <td>
              {this.props.parcel.lastProcessed ? (
                <p>
                  {this.props.parcel.lastProcessed}{" "}
                  <Link
                    href=""
                    color="initial"
                    underline="none"
                    onClick={() =>
                      FlowRouter.go(
                        "/view-parcel-details?parcelId=" + this.props.parcel._id
                      )
                    }
                  >
                    <InfoIcon fontSize="inherit" />
                  </Link>
                </p>
              ) : (
                <p> </p>
              )}
            </td>
          </>
        ) : null}
        <td>{this.props.parcel.location}</td>
        <td>{this.renderRecipientName()}</td>
        <td>{this.createdAt()}</td>
        <td>{this.props.parcel.numberOfItems}</td>
        <td>{this.deliveryDateStatus()}</td>
        <td>{this.props.parcel.outboundAddress}</td>
        <td>{this.props.parcel.notes}</td>
        <td>{xraystatus}</td>
        <td>{this.props.parcel.assignUser}</td>
      </tr>
    );
  }
}

// props
SelectableParcel.propTypes = {
  parcel: PropTypes.object.isRequired,
  checked: PropTypes.bool,
  onChecked: PropTypes.func,
  isGroupClient: PropTypes.bool,
};
SelectableParcel.defaultProps = {
  checked: false,
};
