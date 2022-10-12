import React, { Component }             from 'react';
import { Meteor }                       from 'meteor/meteor';
import { withTracker }                  from 'meteor/react-meteor-data';
import _                                from 'lodash';
import { Senders }                      from '/imports/api/senders.js';
import GridView                         from '/imports/ui/components/GridView.jsx';
import Button                           from '@material-ui/core/Button';

import '/imports/languages/en/en.sender.i18n.yml';
import '/imports/languages/de/de.sender.i18n.yml';
import '/imports/languages/en-JM/en-JM.sender.i18n.yml';

const publicDir = `${Meteor.settings.public.cdn}/public`;
class SendersList extends Component {

  constructor(props){
     super(props);

     this.state = {
      load_more: false,
      limit:20,
      searchColumns:{},
     }
  }

  limitIncFunction = ((limit) => {
    this.setState({limit: this.state.limit + limit});
  });
  
  searchcFunction = ((searchValue) => {
      let column_search = {
        '$or' : [
            { "senderName" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
            { "senderEmail" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
        ]
      };
      this.setState({searchColumns: column_search});
  });

  handleSubmit = (event) => {
    event.preventDefault();
  
    const senderName = this.senderName.value.trim();
    const senderEmail = this.senderEmail.value.trim();
    const { clientId } = Meteor.user().profile;
  
    if (senderName.length <= 0) {
      alert(i18n.__("sender.Please enter a Sender name"));
      return;
    }
  
    //check for a match
    const sender = Senders.findOne({
      senderName: new RegExp(senderName, "i"),
      clientId,
    });
    if (sender) {
      alert(i18n.__("sender.Sender name already exists"));
      return;
    }
    const validEmail = senderEmail
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
    if (!validEmail && senderEmail.length != 0) {
      alert(i18n.__("sender.Invalid Email Address"));
      return;
    }
  
    //insert new sender
    Meteor.call("senders.insert", senderName, senderEmail, clientId);
    // Clear form
    this.senderName.value = "";
    this.senderEmail.value = "";
  };

  renderForm() {
    const currentUserId = Meteor.userId();

    if (!Roles.userIsInRole(currentUserId, ['normal-user','group-admin'])) {
      return (
        <div>
          <form>
          <div className="form-row">
            <input
              type="text"
              ref={c => { this.senderName = c; }}
              placeholder={i18n.__("sender.Add new sender")}
            />
            </div>
            <div className="form-row">
                <input
                  type="text"
                  ref={c => { this.senderEmail = c; }}
                  placeholder={i18n.__("sender.Sender Email")}
                />
            </div>
          </form>
          <div className="form-row">
              <Button
                onClick={this.handleSubmit}
                fullWidth={true}
                color="primary"
                variant="contained"
              >
              {i18n.__("sender.Add Sender")}
              </Button>
            </div>
          <br />
          {/* Data listing component */}
        <GridView 
          limit={this.state.limit} 
          LimitIncFunction={this.limitIncFunction}
          searchFunction={this.searchcFunction}
          searchColumns={this.state.searchColumns}
          initialColumns={[]}
          publications={['senders']} 
          collection={Senders} 
          renderComponent={'Sender'}
        />

        </div>
      );
    }
    if (Roles.userIsInRole(currentUserId, ['normal-user','group-admin'])) {
      return (
        <div className="center m2">
         {i18n.__("common.You are not authorised to view this page")}
        </div>
      );
    }
  }

  render() {
    const { status } = this.props;
    if(status.connected){
      return (
        <div className="width-narrow">
          {this.renderForm()}
        </div>
      );
    }
    return(
    <div className="width-narrow">
    <div>
    <div className="simple-loader">
       <img src={`${publicDir}/img/loading.gif`} />
    </div>
    <div className="data-processing-message">
       <br></br>
        <b>{i18n.__("common.You are offline check your internet connection and try again")}</b>
    </div>
     </div></div>
   )
  }
}
export default withTracker(() => {
  return {
   status: Meteor.status(),
  };
})(SendersList);