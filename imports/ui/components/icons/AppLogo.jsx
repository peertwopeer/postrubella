import React, { Component } from "react";

const publicDir = `${Meteor.settings.public.cdn}/public`;

export default class AppLogo extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div {...this.props}>
        <img
          alt="org_placeholder|postrubella"
          src={`${publicDir}/svg/Logopostrubella.svg`}
        />
      </div>
    );
  }
}
