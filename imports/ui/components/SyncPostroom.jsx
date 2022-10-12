import React, { Component } from "react";

import { SyncCore, SyncParcels } from "/imports/ui/components/";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import "/imports/languages/en/en.sync.i18n.yml";
import "/imports/languages/de/de.sync.i18n.yml";
import "/imports/languages/en-JM/en-JM.sync.i18n.yml";

class Syncpostrubella extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentSecond: Math.floor(Date.now() / 1000),
    };
  }

  componentDidMount() {
    this.timerSecondUpdate = setInterval(() => {
      this.setState({
        currentSecond: Math.floor(Date.now() / 1000),
      });
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timerSecondUpdate);
  }

  renderConnetionStatus() {
    const { status } = this.props;

    return (
      <div>
        <div className="mb1">
          {i18n.__("sync.Connection status")}: {status}
        </div>
        {this.renderConnectionRetry()}
      </div>
    );
  }

  renderConnectionRetry() {
    const { status, retryTime } = this.props;
    const { currentSecond } = this.state;
    const reconnectAfter = Math.max(0, retryTime - currentSecond);

    if (status === "waiting") {
      return (
        <div
          className="sync-status"
          style={{ backgroundColor: "green" }}
          onClick={Meteor.reconnect}
        >
          <div className="sync-status-text">
            {" "}
            {i18n.__("sync.Auto reconnect after")} {reconnectAfter}{" "}
            {i18n.__("common.seconds")}
          </div>
          <div className="sync-status-button">
            {i18n.__("sync.Click to reconnect now")}!
          </div>
        </div>
      );
    } else if (status === "connecting") {
      return (
        <div className="sync-status" style={{ backgroundColor: "grey" }}>
          <div className="sync-status-text">{i18n.__("sync.Connecting")}</div>
          <div className="sync-status-text">
            {i18n.__("sync.Please wait")}..
          </div>
        </div>
      );
    } else if (status === "offline") {
      return (
        <div
          className="sync-status"
          style={{ backgroundColor: "green" }}
          onClick={Meteor.reconnect}
        >
          <div className="sync-status-button">
            {i18n.__("sync.Click to reconnect")}!
          </div>
        </div>
      );
    }
  }

  render() {
    return (
      <div className="flex flex-center px2">
        <div className="mx-auto">
          <div className="center">
            {this.renderConnetionStatus()}
            <SyncParcels />
            <SyncCore />
          </div>
        </div>
      </div>
    );
  }
}

// status: Meteor.status(),
export default withTracker(() => {
  const status = Meteor.status();

  return {
    status: status.status,
    connected: status.connected,
    retryTime: Math.floor(status.retryTime / 1000),
  };
})(Syncpostrubella);
