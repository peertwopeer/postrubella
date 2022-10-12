import React, { Component } from 'react';

class DashboardButton extends Component {

  render() {
    return (
      <div className="dashboard-button">

        <a href={this.props.link}>
          <div className="inside">

            <div className="dashboard-button-top clearfix">
              <div className="dashboard-button-top-left">
                <div className="dashboard-button-icon">{this.props.icon}</div>
                <div className="dashboard-button-title">{this.props.title}</div>
              </div>
              <div className="dashboard-button-top-right">
                <div className="dashboard-button-total">{this.props.total}</div>
              </div>
            </div>

            <div className="dashboard-button-bottom clearfix">
              <div className="dashboard-button-description">{this.props.description}</div>
            </div>

          </div>
        </a>

      </div>
    );
  }
}


export default DashboardButton;
