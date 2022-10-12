import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';


class ViewImageFile extends Component {

  constructor(props) {
    super(props);
    this.state = {
    };
  }
  
  componentDidMount() {
  }

  render() {
    return (<div><img src={this.props.fileUrl+'?request='+(new Date().getTime()) + (Math.random() * 50000)} /></div>);
  }

  }

export default withTracker(() => ({}))(ViewImageFile);
