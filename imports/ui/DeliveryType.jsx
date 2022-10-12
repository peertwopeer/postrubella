import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import moment     from 'moment-timezone';
import Paper      from '@material-ui/core/Paper';
import Button     from '@material-ui/core/Button';

import { DeliveryTypes } from '/imports/api/deliveryTypes.js';

import '/imports/languages/en/en.deliver.i18n.yml';
import '/imports/languages/de/de.deliver.i18n.yml';
import '/imports/languages/en-JM/en-JM.deliver.i18n.yml';

const publicDir = `${Meteor.settings.public.cdn}/public`;

export default class DeliveryType extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: null,
      showClient: null,
      deliveryTypeName: this.props.deliveryType.deliveryTypeName,
      clientName:'',
    };
  }

  handleDeliveryTypeNameChange = (event) => {
    this.setState({ deliveryTypeName: event.target.value });
  };
  deleteInputChange = (event) => {
    this.setState({ deleteInputValue: event.target.value });
  };
  toggleEditing = () => {
    this.setState({ editing: this.props.deliveryType._id });
  };
  cancelEditing = () => {
    this.setState({ editing: null });
  };


  deleteButton() {

    if (this.state.deleteInputValue !== 'DELETE') {
      return (
        <div className="block-icon" onClick={this.cancelEditing}>
          <img src={`${publicDir}/svg/Cancel.svg`} />
        </div>
      );
    }
    if (this.state.deleteInputValue === 'DELETE') {
      return (
        <div className="block-icon" onClick={this.handleDelete}>
          <img src={`${publicDir}/svg/icon-bin.svg`} />
        </div>
      );
    }
  }

  handleDelete = (event) => {
    event.preventDefault();

    if (window.confirm(i18n.__("deliver.Are you sure to Delete Delivery Type :")+this.props.deliveryType.deliveryTypeName.trim()+" ?")){
      const deliveryTypeId = this.props.deliveryType._id;
      let thisComponent = this;
      Meteor.call('deliveryTypes.remove', deliveryTypeId, function(err, result){
        if(result){
          alert(i18n.__("deliver.Delivery Type")+thisComponent.props.deliveryType.deliveryTypeName.trim()+i18n.__("common.Deleted Successfully"));
          window.location.reload();
        }
      });
    }
  };
  showClient = (event) => {
    const clientId                = this.props.deliveryType.clientId;
    this.setState({showClient: clientId })
    let thisComponent = this;
    Meteor.call('clients.showDetails',clientId,function(err,result){
      if(result){
        thisComponent.setState({clientName:result[0].clientName})
       }
     })
   }
  
  handleSubmit = (event) => {
    event.preventDefault();

    const deliveryTypeId          = this.state.editing;
    const deliveryTypeName        = this.deliveryTypeName.value.trim()
   
    const clientId                = this.props.deliveryType.clientId.value?this.props.deliveryType.clientId.value:this.props.deliveryType.clientId;
    if (deliveryTypeName.length   <= 0) return;
    //check for a match
    const deliveryType = DeliveryTypes.findOne({
      deliveryTypeName: new RegExp(deliveryTypeName, 'i'),
      clientId,
    });
    if(deliveryType) {
      let text = deliveryType.deliveryTypeName.toLowerCase().split(/\s/).join('');
      let newDeliveryType = deliveryTypeName.toLowerCase().split(/\s/).join('');
      if (text == newDeliveryType) {
        console.error(deliveryType, 'already exists!');
        alert(i18n.__("deliver.DeliveryType already exists"))
        return;
      } 
    }
    //update deliverytype 
    Meteor.call('deliveryTypes.update',deliveryTypeId, deliveryTypeName);
    this.setState({ editing: null });
  };

  renderOrEditDeliveryType() {
    if (this.state.editing === null) {
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">

              <div className="block-content clearix">
                <div className="inside">
                  <div className="block-title medium">{this.props.deliveryType.deliveryTypeName}</div>
                 </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <div className="block-meta-text">
                     <div hidden={this.state.showClient !==null}> 
                      <Button onClick={this.showClient} variant="contained" color="primary">{i18n.__("common.Show Client")}</Button>
                      </div>
                      <br></br>
                      <div hidden={this.state.showClient ===null} className="block-row"><b>{i18n.__("common.clientName:")}</b>{this.state.clientName}</div>
                    <div className="block-row"><b>{i18n.__("common.Added By:")}</b>{this.props.deliveryType.username}</div>
                    <div className="block-row"><b>{i18n.__("common.Added At:")}</b>{ moment(this.props.deliveryType.createdAt).tz(this.props.timezone).format('lll') }</div>
                  </div>
                  <div className="block-meta-links">
                    {
                      <div className="block-icon" onClick={this.toggleEditing}>
                        <img src={`${publicDir}/svg/IconSettings.svg`} />
                      </div>
                    }
                  </div>
                </div>
              </div>

            </div>
          </Paper>
        </div>
      );
    }

    const clickedId = this.props.deliveryType._id;

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
                        ref={c => { this.deliveryTypeName = c; }}
                        placeholder={i18n.__("deliver.Delivery Type Name")}
                        value={this.state.deliveryTypeName}
                        onChange={this.handleDeliveryTypeNameChange}
                      />
                    </div>
                    <div className="form-row">
                      <Button onClick={this.handleSubmit} variant="contained" color="primary" fullWidth={true}>{i18n.__("common.Update")}</Button>
                    </div>
                  </form>

                </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <div className="block-meta-text col-6">
                    <div className="block-row">
                      <input
                        type="text"
                        ref={c => { this.confirmDelete = c; }}
                        placeholder="DELETE"
                        value={this.state.deleteInputValue}
                        onChange={this.deleteInputChange}
                      />
                    </div>
                  </div>
                  <div className="block-meta-links col-6">
                    {this.deleteButton()}
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
        { this.renderOrEditDeliveryType() }
      </div>
    );
  }
}
// props
DeliveryType.propTypes = {
  deliveryType: PropTypes.object.isRequired,
};
