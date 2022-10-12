import React, { Component } from 'react';

const styles = {
  textAlign: 'center',
  background: 'red',
  padding: '7px',
  letterSpacing: '1px',
  fontSize: '13.5px',
  lineHeight: '15.5px',
  fontWeight: 'bold',
}

export default class NoticeHeader extends Component {
  constructor(props) {
    super(props);
  }
  
  render(){
    return (
      <div style={styles}>
        {this.props.children}
      </div>
    );
  }

};
