import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import moment from "moment";

class DebugCollection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      barcode: "",
      parcel: undefined,
      showParcel: false,
    };
  }

  linkStyles() {
    return {
      textAlign: "center",
      borderRadius: "3px",
      backgroundColor: "#f6c01b",
      color: "#fff",
      padding: "10px 16px",
      lineHeight: ";20px",
      fontSize: "14px",
      textTransform: "uppercase",
      fontWeight: 500,
      display: "block",
    };
  }

  imgStyles() {
    return {
      maxWidth: "210px",
    };
  }

  handleBarcodeChange = (event) => {
    this.setState({ barcode: event.target.value });
  };

  handleParcelState = (currentParcel) => {
    this.setState({
      parcel: currentParcel,
      showParcel: false,
    });
    this.setState({
      showParcel: true,
    });
  };

  getParcel = () => {
    // Get parcel ID from state
    const parcelId = this.state.barcode;

    // Go to server and Grab the parcel props
    Meteor.call("getParcel", parcelId, (error, result) => {
      const currentParcel = result[0];

      // result
      if (result === undefined) {
        console.log(" Please enter a valid barcode. For example TAG-100111");

        return;
      }
      if (result) {
        this.handleParcelState(currentParcel);
      }

      // empty

      // error
      if (error) {
        console.log("Error: ", error);
      }
    });
  };

  renderParcel() {
    if (this.state.showParcel === true) {
      const parcel = this.state.parcel;

      if (parcel === undefined) return;

      return (
        <div>
          <h3>Your Parcel: </h3>
          <b>_id</b>: {parcel._id}
          <br />
          <b>barcode:</b> {parcel.barcode}
          <br />
          <b>clientUniqueBarcode:</b> {parcel.clientUniqueBarcode}
          <br />
          <b>createdAt:</b> {moment(parcel.createdAt).format("lll")}
          <br />
          <b>clientId:</b> {parcel.clientId}
          <br />
          <b>username:</b> {parcel.username}
          <br />
          <b>type:</b> {parcel.type}
          <br />
          <b>carrier:</b> {parcel.carrier}
          <br />
          <b>sender:</b> {parcel.sender}
          <br />
          <b>location:</b> {parcel.location}
          <br />
          <b>recipientName:</b> {parcel.recipientName}
          <br />
          <b>outboundAddres:</b> {parcel.outboundAddres}
          <br />
          <b>numberOfItems:</b> {parcel.numberOfItems}
          <br />
          <b>notes:</b> {parcel.notes}
          <br />
          <b>postbagOwner:</b> {parcel.postbagOwner}
          <br />
          <b>deliveredAt:</b> {moment(parcel.deliveredAt).format("lll")}
          <br />
          <b>deliveryUser:</b> {parcel.deliveryUser}
          <br />
          <b>deliveryType:</b> {parcel.deliveryType}
          <br />
          <b>deliveredByOwner:</b> {parcel.deliveredByOwner}
          <br />
          <b>signee:</b> {parcel.signee}
          <br />
          <br />
          <b>Legacy Fields:</b>
          <div style={this.imgStyles()}>
            <b>postrubellaBarcode:</b>
            <br />
            <img src={parcel.postrubellaBarcode} />
          </div>
          <div style={this.imgStyles()}>
            <b>recipientSignature:</b>
            <br />
            <img src={parcel.recipientSignature} />
            <br />
          </div>
          <b>recipientInboundName:</b> {parcel.recipientInboundName}
          <br />
          <b>recipientOutboundName:</b> {parcel.recipientOutboundName}
        </div>
      );
    }
  }

  renderDebugCollection() {
    return (
      <div>
        <div className="form-row">
          <input
            type="text"
            placeholder="Enter org_placeholder Barcode"
            value={this.state.barcode}
            onChange={this.handleBarcodeChange}
          />
        </div>

        <div className="form-row">
          <div style={this.linkStyles()} onClick={this.getParcel}>
            Lookup Parcel
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="width-narrow clearfix">
        <div>{this.renderDebugCollection()}</div>

        {this.renderParcel()}
      </div>
    );
  }
}

export default withTracker(() => ({}))(DebugCollection);
