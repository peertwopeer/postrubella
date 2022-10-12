import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import DashboardButton from "/imports/ui/components/DashboardButton.jsx";
import Button from "@material-ui/core/Button";
import "/imports/languages/en/en.admin.i18n.yml";
import "/imports/languages/de/de.admin.i18n.yml";
import "/imports/languages/en-JM/en-JM.admin.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;

class Admin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locationData: [],
      loading: false,
    };
  }
  renderAdminLinks = () => {
    const currentUserId = Meteor.userId();

    if (Roles.userIsInRole(currentUserId, ["super-admin"])) {
      return (
        <div>
          {this.state.loading ? (
            <div>
              <div className="simple-loader">
                <img src={`${publicDir}/img/loading.gif`} />
              </div>
            </div>
          ) : (
            ""
          )}
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Users")}
            description={i18n.__("admin.Create and remove users")}
            link="/admin/users"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Clients")}
            description={i18n.__("admin.Add clients to the postrubella")}
            link="/clients"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Locations")}
            description={i18n.__("admin.Add location to your postrubella")}
            link="/locations"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Carriers")}
            description={i18n.__("admin.Add carriers to the postrubella")}
            link="/carriers"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Carriers Admin")}
            description={i18n.__("admin.Add carriers to the postrubella")}
            link="/admin/carriers"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Senders")}
            description={i18n.__("admin.Add senders to the postrubella")}
            link="/senders"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Delivery Type")}
            description={i18n.__("admin.Add delivery types to the postrubella")}
            link="/delivery-type"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Recipients")}
            description={i18n.__("admin.Create and remove recipients")}
            link="/recipients"
          />
          {/* <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Outbound Emails")}
            description={i18n.__("admin.View log of outbound emails")}
            link="/outbound-email-logs"
          /> */}

          {/* <div className="margin-bottom-65">
            <Button onClick={this.cleanDeliveryTypes} variant="contained" color="primary" >{i18n.__("admin.Clean Delivery Types")}</Button>
            </div> */}
          {/* <div>
            <input type="file" accept=".csv" onChange={this.loadLocations} />
          </div>
          <div className="mt2">
            <Button onClick={this.copyClients} variant="contained" color="default">
              {`CLICK TO COPY RECIPIENTS`}
            </Button>
          </div> */}
        </div>
      );
    }
  };
  copyClients = () => {
    if (
      confirm(
        "COPY all Battersea Concierge RECIPIENTS to \nBattersea Power Station?"
      )
    ) {
      this.setState({ loading: true });
      Meteor.call("recipients.copyRecipients", (error, result) => {
        this.setState({ loading: false });
        alert(
          `Total recipients: ${result.total} \nRecipients copied: ${result.successCount}`
        );
      });
    } else {
      return;
    }
  };

  loadLocations = async (event) => {
    let thisComponent = this;
    event.preventDefault();
    Papa.parse(event.target.files[0], {
      download: true,
      skipEmptyLines: true,
      complete: function (results, file) {
        let data = results.data;
        thisComponent.setState({ loading: true });

        Meteor.call("locationData.bulkInsert", data, (error, result) => {
          thisComponent.setState({ loading: false });
          alert(
            `Total records: ${data.length} \nRecords inserted: ${result.successCount}`
          );
        });
      },
    });
  };
  // cleanDeliveryTypes = () => {
  //   Meteor.call("deliveryTypes.cleanDb", (error, result) => {
  //     alert(result + " records removed");
  //   });
  // };

  renderManagerLinks = () => {
    const currentUserId = Meteor.userId();

    if (
      Roles.userIsInRole(currentUserId, ["client-manager", "location-manager"])
    ) {
      return (
        <div>
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Users")}
            description={i18n.__("admin.Create and remove users")}
            link="/users"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Locations")}
            description={i18n.__("admin.Add location to your postrubella")}
            link="/locations"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Carriers")}
            description={i18n.__("admin.Add carriers to the postrubella")}
            link="/carriers"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Senders")}
            description={i18n.__("admin.Add senders to the postrubella")}
            link="/senders"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Delivery Type")}
            description={i18n.__("admin.Add delivery types to the postrubella")}
            link="/delivery-type"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Recipients")}
            description={i18n.__("admin.Create and remove recipients")}
            link="/recipients"
          />
          <DashboardButton
            icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
            title={i18n.__("admin.Default Values")}
            description={i18n.__("admin.Set default values for dropdowns")}
            link="/deafault-values"
          />
        </div>
      );
    }
  };

  render() {
    const { status } = this.props;

    return (
      <div className="width-narrow">
        {!status.connected ? (
          <div>
            <div className="simple-loader">
              <img src={`${publicDir}/img/loading.gif`} />
            </div>
            <div className="data-processing-message">
              <br></br>
              <b>
                {i18n.__(
                  "common.You are offline check your internet connection and try again"
                )}
              </b>
            </div>
          </div>
        ) : (
          [this.renderManagerLinks(), this.renderAdminLinks()]
        )}
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    status: Meteor.status(),
  };
})(Admin);
