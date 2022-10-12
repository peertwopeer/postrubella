import React, { Component } from 'react';

const styles = {
  textAlign: 'center',
  background: '#f4f4f4',
  padding: '7px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontSize: '15.5px',
  lineHeight: '15.5px',
  fontWeight: 'bold',
};

export default class PageHeader extends Component {
  constructor(props) {
    super(props);
  }
  
  render(){
    return (
      <div style={styles}>
        {this.props.title}
      </div>
    );
  }
};
