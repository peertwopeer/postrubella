import React, { Component }             from 'react';
import PropTypes                        from 'prop-types';
import { Meteor }                       from 'meteor/meteor';
import moment                           from 'moment-timezone';
import Paper                            from '@material-ui/core/Paper';
import Button                           from '@material-ui/core/Button';

import Carriers from '/imports/api/carriers.js';

import '/imports/languages/en/en.carriers.i18n.yml';
import '/imports/languages/de/de.carriers.i18n.yml';
import '/imports/languages/en-JM/en-JM.carriers.i18n.yml';
const publicDir = `${Meteor.settings.public.cdn}/public`;

export default class Carrier extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: null,
      showClient: null,
      carrierName: this.props.carrier.carrierName,
      deleteInputValue: '',
      clientName:'',
    };
  }

  handleCarrierNameChange = (event) => {
    this.setState({ carrierName: event.target.value });
  };
  toggleEditing = () => {
    this.setState({ editing: this.props.carrier._id });
  };
  cancelEditing = () => {
    this.setState({ editing: null });
  };

  showClient = (event) => {
    const clientId                = this.props.carrier.clientId;
    this.setState({showClient: clientId })
    let thisComponent = this;
    Meteor.call('clients.showDetails',clientId,function(err,result){
      if(result){
        thisComponent.setState({clientName:result[0].clientName})
       }
     })
   }
  handleUpdate = (event) => {
    event.preventDefault();

    const carrierId     = this.state.editing;
    const carrierName   = this.carrierName.value.trim();

    if (carrierName.length === 0) return alert(i18n.__("carriers.Please enter a Carrier name"));
    const updatePath = Roles.userIsInRole(Meteor.userId(), ['super-admin'])
      ? 'carriers.update.admin'
      : 'carriers.update';

    Meteor.call(updatePath, carrierId, carrierName, (err) => {
      if (err) return alert(err);
      this.setState({ editing: null });
    });
  }
  onSelected = () => {
    this.props.onChecked(this.props.carrier._id, this.selectable.checked);
  };

  renderOrEditCarrier() {
    if (this.state.editing === null) {
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">

              <div className="block-content clearix">
                <div className="inside">
                  <div className="block-title medium">{this.props.carrier.carrierName}</div>
                </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <div className="block-meta-text">
                  <div hidden={this.state.showClient !==null}> 
                      <Button
                        onClick={this.showClient}
                        variant="contained" 
                        color="primary"
                      >
                      {i18n.__("common.Show Client")}
                      </Button>
                      </div>
                      <br></br>
                      <div hidden={this.state.showClient ===null} className="block-row"><b>{i18n.__("common.clientName:")}</b>{this.state.clientName}</div>
                    <div className="block-row"><b>{i18n.__("common.Added By:")}</b>{this.props.carrier.username}</div>
                    <div className="block-row"><b>{i18n.__("common.Added At:")}</b>{ moment(this.props.carrier.createdAt).tz(this.props.timezone).format('lll') }</div>
                  </div>
                  <div className="block-meta-links">
                  <div className="block-icon">
                  <input
                    type="checkbox"
                    ref={input => { this.selectable = input; }}
                    className="checkbox"
                    defaultChecked={this.props.checked}
                    name="selectRecipient"
                    value={this.props.carrier._id}
                    onClick={this.onSelected}
                  />
                </div>
                    <div className="block-icon" onClick={this.toggleEditing}>
                      <img src={`${publicDir}/svg/IconSettings.svg`} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </Paper>
        </div>
      );
    }

    const clickedId = this.props.carrier._id;

    if (this.state.editing === clickedId) {
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">

              <div className="block-content clearix">
                <div className="inside">

                  <form>
                    <div className="form-row">
                      <input
                        type="text"
                        ref={c => { this.carrierName = c; }}
                        placeholder={i18n.__("carriers.Carrier Name")}
                        value={this.state.carrierName}
                        onChange={this.handleCarrierNameChange}
                      />
                    </div>
                    <div className="form-row">
                      <Button onClick={this.handleUpdate} variant="contained" color="primary" fullWidth={true}>{i18n.__("carriers.Update Carrier")}</Button>
                    </div>
                  </form>

                </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <h6>&nbsp;</h6>
                  <div className="block-meta-links col-6">
                  <div className="block-icon" onClick={this.cancelEditing}>
                      <img src={`${publicDir}/svg/Cancel.svg`} />
                  </div>
                  </div>
                </div>
              </div>

            </div>
          </Paper>
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        { this.renderOrEditCarrier() }
      </div>
    );
  }
}
Carrier.propTypes = {
  carrier: PropTypes.object.isRequired,
};
