import React, { Component } from "react";
import DashboardButton from "/imports/ui/components/DashboardButton.jsx";

import "/imports/languages/en/en.navigation.i18n.yml";
import "/imports/languages/de/de.navigation.i18n.yml";
import "/imports/languages/en-JM/en-JM.navigation.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;

export default class Navigation extends Component {
  render() {
    return (
      <div className="navigation">
        <DashboardButton
          icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
          title={i18n.__("navigation.Inbound")}
          description={i18n.__(
            "navigation.Take an item and add to postrubella"
          )}
          link="/inbound"
        />

        <DashboardButton
          icon={<img src={`${publicDir}/svg/icon-receive.svg`} />}
          title={i18n.__("navigation.Outbound")}
          description={i18n.__(
            "navigation.Scan an item, assign location to be sent out"
          )}
          link="/outbound"
        />

        <DashboardButton
          icon={<img src={`${publicDir}/svg/icon-postrubella.svg`} />}
          title={i18n.__("navigation.postrubella")}
          description={i18n.__("navigation.All items awaiting delivery")}
          link="/postrubella"
        />

        <DashboardButton
          icon={<img src={`${publicDir}/svg/icon-postbag.svg`} />}
          title={i18n.__("navigation.Postbag")}
          description={i18n.__(
            "navigation.Add to your Postbag awaiting delivery"
          )}
          link="/add"
        />

        <DashboardButton
          icon={<img src={`${publicDir}/svg/icon-deliver.svg`} />}
          title={i18n.__("navigation.My Delivery")}
          description={i18n.__("navigation.Deliver post in your Postbag")}
          link="/postbag"
        />

        <DashboardButton
          icon={<img src={`${publicDir}/svg/icon-reports.svg`} />}
          title={i18n.__("navigation.Reports")}
          description={i18n.__("navigation.Search and generate reports")}
          link="/reports"
        />
      </div>
    );
  }
}
