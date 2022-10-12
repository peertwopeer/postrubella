import React, { Component } from 'react';

export default class Loading extends Component {
  render() {
    const { message, link, color } = this.props;

    if (link) {
      return (
        <div style={{ textAlign: 'center' }}><a style={{ color }} href={link}>{message}</a></div>
      );
    }

    return (
      <div style={{ color, textAlign: 'center' }}> {message} </div>
    );
  }
}
