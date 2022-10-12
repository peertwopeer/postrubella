import React, { Component } from "react";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import Link from "@material-ui/core/Link";

export default class Footer extends Component {
  routeTermsOfUse() {
    FlowRouter.go("/termsOfUse");
  }

  render() {
    return (
      <div className="clearfix">
        <div className="footer">
          <Link
            onClick={this.routeTermsOfUse}
            variant="body2"
            className="text-dark-gray text15 mr-10"
            component="button"
            underline="none"
          >
            {i18n.__("common.org_placeholder Terms of Use")}
          </Link>
        </div>
      </div>
    );
  }
}
