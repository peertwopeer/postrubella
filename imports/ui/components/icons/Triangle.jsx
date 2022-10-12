import React, { Component } from "react";
import { SvgIcon } from "@material-ui/core";

const defaultProps = {
  viewBox: "0 0 16 16",
  style: {
    height: "16px",
    width: "16px",
  },
};

export default class org_placeholderTriangle extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <SvgIcon {...Object.assign({}, defaultProps, this.props)}>
        <path d="M12.9,14.6c-2.7,0-7.2,0-9.9,0s-3.8-1.9-2.5-4.3s3.6-6.2,4.9-8.5s3.6-2.3,4.9,0S14,8,15.4,10.3 S15.6,14.6,12.9,14.6z" />
      </SvgIcon>
    );
  }
}
