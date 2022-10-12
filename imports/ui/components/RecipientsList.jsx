import React, { Component }             from 'react';
import { Meteor }                       from 'meteor/meteor';
import { withTracker }                  from 'meteor/react-meteor-data';
import _                                from 'lodash';
import { Recipients }                   from '/imports/api/recipients.js';
import GridView                         from '/imports/ui/components/GridView.jsx';
import Button                           from '@material-ui/core/Button';

import '/imports/languages/en/en.recipient.i18n.yml';
import '/imports/languages/de/de.recipient.i18n.yml';
import '/imports/languages/en-JM/en-JM.recipient.i18n.yml';

const publicDir = `${Meteor.settings.public.cdn}/public`;
class RecipientsList extends Component {

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
            { "recipientName" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
        ]
      };

      this.setState({searchColumns: column_search});
  });

  handleSubmit = (event) => {
    event.preventDefault();
    const recipientName        = this.recipientName.value.trim();
    if (recipientName.length  <= 0) return;

    const currentUserClientId = Meteor.user().profile.clientId;
    const clientId            = currentUserClientId;
  //check for a match
    const recipient = Recipients.findOne({
      recipientName: new RegExp(recipientName, 'i'),
      clientId,
    });
    if(recipient){
      let  text         = recipient.recipientName.toLowerCase().split(/\s/).join('');
      let  newRecipient = recipientName.toLowerCase().split(/\s/).join('');
         if (text == newRecipient) {
          console.error(recipient, 'already exists!');
          alert(i18n.__("recipient.Recipient name already exists"));
          return;
        } 
    }
  //insert new recipient name    
    Recipients.insert({
      recipientName,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username,
      clientId,
      });
   // Clear form
    this.recipientName.value = '';
  };


  renderRecipientsForm() {
    const currentUserId = Meteor.userId();

    if (!Roles.userIsInRole(currentUserId, ['normal-user','group-admin'])) {
      return (
        <div>
          <form>
          <div className="form-row">
          <input
              type="text"
              ref={c => { this.recipientName = c; }}
              placeholder={i18n.__("recipient.Add new recipient")}
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
              {i18n.__("recipient.Add recipient")}
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
          publications={['recipients']} 
          collection={Recipients} 
          renderComponent={'Recipient'}
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
    
          {this.renderRecipientsForm()}
    
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
  const user = Meteor.user();

  if (user){
    //set language
    if((typeof user.profile.language !== 'undefined') && (user.profile.language !== '')){
      i18n.setLocale(user.profile.language);
    }  
  }
  return {
    status: Meteor.status(),
  };
})(RecipientsList);
