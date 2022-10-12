// npm
import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import { Session } from "meteor/session";
import DashboardButton from "/imports/ui/components/DashboardButton.jsx";

// collections

// component
class Dashboard extends Component {
  render() {
    return (
      <div className="width-narrow">
        <DashboardButton
          icon={<img src="/svg/icon-receive.svg" />}
          title="Receive"
          description="Scan an item, assign location and add to the postrubella."
          link="/receive"
          total={this.props.numberOfParcelsInbound}
        />

        <DashboardButton
          icon={<img src="/svg/icon-receive.svg" />}
          title="Outbound"
          description="Scan an item, assign location to be sent out."
          link="/outbound"
          total={this.props.numberOfParcelsOutbound}
        />

        <DashboardButton
          icon={<img src="/svg/icon-postrubella.svg" />}
          title="postrubella"
          description="All items in the postrubella awaiting delivery."
          link="/postrubella"
          total={this.props.numberOfParcelsUndelivered}
        />

        <DashboardButton
          icon={<img src="/svg/icon-postbag.svg" />}
          title="Postbag"
          description="Add to your Postbag awaiting to delivered."
          link="/add"
          total={this.props.numberOfParcelsInPostbag}
        />

        <DashboardButton
          icon={<img src="/svg/icon-deliver.svg" />}
          title="Deliver"
          description="View post in your Postbag awaiting delivery."
          link="/postbag"
          total={this.props.numberOfParcelsInPostbag}
        />

        <DashboardButton
          icon={<img src="/svg/icon-reports.svg" />}
          title="Reports"
          description="Search and generate reports for both received and delivered."
          link="/reports"
          total={this.props.numberOfParcels}
        />

        {/* <DashboardButton */}
        {/* icon={<img src="/svg/icon-reports.svg" />} */}
        {/* title="Help" */}
        {/* description="xxxxxx" */}
        {/* link="/help" */}
        {/* /> */}
      </div>
    );
  }
}

// container
export default withTracker(() => {
  const stats = {
    numberOfParcelsInbound: 0,
    numberOfParcelsOutbound: 0,
    numberOfParcelsUndelivered: 0,
    numberOfParcelsInPostbag: 0,
    numberOfParcels: 0,
  };

  const sessionStates = Session.get("parcels.dashboard");

  return { ...stats, ...sessionStates };
})(Dashboard);
