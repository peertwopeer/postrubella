import React, { Component }             from 'react';
import { Meteor }                       from 'meteor/meteor';
import { withTracker }                  from 'meteor/react-meteor-data';
import { Random }                       from 'meteor/random';
import Button                           from '@material-ui/core/Button';
import { Clients }                      from '/imports/api/clients.js';
import GridView                         from '/imports/ui/components/GridView.jsx';
import '/imports/languages/en/en.users.i18n.yml';
import '/imports/languages/de/de.users.i18n.yml';
import '/imports/languages/en-JM/en-JM.users.i18n.yml';

const publicDir = `${Meteor.settings.public.cdn}/public`;
class AdminUserList extends Component {

  constructor(props){
       super(props);

       this.state = {
         load_more: false,
         limit:20,
         searchColumns:{},
         timezone: '',
         language: '',
         selectClient:'',
       }
   }

   componentWillUnmount() {
    
  }

  limitIncFunction = ((limit) => {
    this.setState({limit: this.state.limit + limit});
  });
  
  searchcFunction = ((searchValue) => {
      let column_search = {
        '$or' : [
            { "username" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
            { "profile.firstname" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
            { "profile.lastname" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
            { "emails" : { '$elemMatch' : { 'address' : { "$regex": searchValue.trim()+'.*', "$options":'i'}}}},
        ]
      };
      this.setState({searchColumns: column_search});
  });

  handleSubmit = async (event) => {
    event.preventDefault();

    const currentUserId = Meteor.userId();
    
    if (Roles.userIsInRole(currentUserId, ['super-admin'])) { 
      const emailDetails = {
        username: this.usernameInput.value.replace(/\s+/g, '').toLowerCase().trim(),
        password: Random.id([7]),
        email: this.emailInput.value.trim(),
        clientId: this.clientSelect.value.trim(),
        role: this.roleSelect.value.trim(),
        firstname: this.firstnameInput.value.trim(),
        lastname: this.lastnameInput.value.trim(),
        language: this.languageSelect.value.trim(),
        timezone: this.timeZoneSelect.value.trim(),
       };
      
      if (emailDetails.username.length   <= 2) return alert(i18n.__("users.The username needs to be at least 3 characters in length"));

      var user_details_found = await Meteor.users.findOne({ username: emailDetails.username });
      if(user_details_found != "" && typeof user_details_found != "undefined" && user_details_found != undefined && user_details_found != null){
         return alert(i18n.__("users.Please enter a Different Username. This Username is Already used"));
      }

      if (emailDetails.firstname.length  <= 0) return alert(i18n.__("users.Please enter a first name"));
      if (emailDetails.lastname.length   <= 0) return alert(i18n.__("users.Please enter a last name"));
      if (emailDetails.email.length      <  6) return alert(i18n.__("users.Please enter a email"));

      var user_details_found = await Meteor.users.findOne({emails : { '$elemMatch' : { 'address' : emailDetails.email } }});

      console.log('user_details_found ::: ', user_details_found);
      if(user_details_found != "" && typeof user_details_found != "undefined" && user_details_found != undefined && user_details_found != null){
         return alert(i18n.__("users.Please enter a Different email. This email is Already used"));
      }

      if (emailDetails.clientId.length   <= 0) return alert(i18n.__("users.Please enter a client"));
      if (emailDetails.role.length       <= 0) return alert(i18n.__("users.Please enter a role"));

      const options = {
        username: emailDetails.username,
        password: emailDetails.password,
        email: emailDetails.email,
        profile: {
          clientId: emailDetails.clientId,
          firstname: emailDetails.firstname,
          lastname: emailDetails.lastname,
          language: emailDetails.language,
          timezone: emailDetails.timezone,
         },
        roles: [emailDetails.role],
      };

      Meteor.call('createNewUser', options, emailDetails);
      this.usernameInput.value   = '';
      this.firstnameInput.value  = '';
      this.lastnameInput.value   = '';
      this.emailInput.value      = '';
      this.clientSelect.value    = '0';
      this.roleSelect.value      = '0';
      this.languageSelect.value  = '';
      this.timeZoneSelect.value  = '';
    }
  };
// languages
renderLanguages () {
  const clientId = this.state.selectClient ? this.state.selectClient : Meteor.user().profile.clientId;
  
  if(this.props.dataSubscription){
    const client = Clients.findOne({_id : clientId });
    if((typeof client.optionalLanguages !== 'undefined') && (client.optionalLanguages !== '')){
      return client.optionalLanguages.map(language =>(
        <option key={language.value} value={language.value}>{language.label}</option>
    ))
    }
  }
}


// timezones
 renderTimeZones() {
  const clientId = this.state.selectClient ? this.state.selectClient : Meteor.user().profile.clientId;
  
  if(this.props.dataSubscription){
    const client =  Clients.findOne({_id : clientId });
    if((typeof client.optionalTimeZones !== 'undefined') && (client.optionalTimeZones !== '')){
    return client.optionalTimeZones.map(timezone =>(
      <option key={timezone.value} value={timezone.value}>{timezone.label}</option>
    ))
  }}
}
handleTimeZone= (event) => {
  this.setState({ timezone: event.target.value });
};
handleLanguage= (event) => {
  this.setState({ language: event.target.value });
};
handleClients = (event) => {
  this.setState({ selectClient: event.target.value });
};
  
  renderUserCreateForm() {
    const currentUserId = Meteor.userId();

    if (Roles.userIsInRole(currentUserId, ['super-admin'])) {
      return (
        <div>
          <form>

            <div className="form-row">
              <input
                type="text"
                ref={c => { this.usernameInput = c; }}
                placeholder={i18n.__("users.Username")}
              />
            </div>

            <div className="form-row">
              <input
                type="text"
                ref={c => { this.firstnameInput = c; }}
                placeholder={i18n.__("users.Firstname")}
              />
            </div>

            <div className="form-row">
              <input
                type="text"
                ref={c => { this.lastnameInput = c; }}
                placeholder={i18n.__("users.Lastname")}
              />
            </div>

            <div className="form-row">
              <input
                type="text"
                ref={c => { this.emailInput = c; }}
                placeholder={i18n.__("users.Email Address")}
              />
            </div>

            <div className="form-row">
              <select name="clients" ref={c => { this.clientSelect = c; }} defaultValue="0" onChange={this.handleClients} >
                <option value="0" disabled defaultValue>{ i18n.__("users.Choose Client") }</option>
                {this.renderClients()}
              </select>
            </div>

            <div className="form-row">
              <select name="roles" ref={c => { this.roleSelect = c; }} defaultValue="0" >
                <option value="0" disabled defaultValue>{ i18n.__("users.Choose Role") }</option>
                <option value="normal-user">{ i18n.__("users.Normal user") }</option>
                <option value="client-manager">{ i18n.__("users.Client Manager") }</option>
                <option value="location-manager">{ i18n.__("users.Location Manager") }</option>
                <option value="super-admin">{ i18n.__("users.Super Admin") }</option>
                <option value="group-admin">{ i18n.__("users.Group Admin") }</option>
              </select>
            </div>
            <div className="form-row">
            <label><span className={"client-form-logo-label"}>{i18n.__('users.Set App language and timezone for Users')}</span></label>
              <br></br>
              <p className={"client-form-logo-description"}>{i18n.__('users.Set language and timezone of the application')}</p>
              <select name="language" ref={c => { this.languageSelect = c; }} onChange={this.handleLanguage}>
                <option value=""  defaultValue>{ i18n.__("users.Set a default Language") }</option>
                {this.renderLanguages()}
              </select>
            </div>
            <div className="form-row">
              <select name="timezone" ref={c => { this.timeZoneSelect = c; }} onChange={this.handleTimeZone}>
                <option value=""  defaultValue>{ i18n.__("users.Set a default TimeZone") }</option>
                {this.renderTimeZones()}
              </select>
            </div>
           
            <div className="form-row">
              <Button onClick={this.handleSubmit} variant="contained" color="primary" fullWidth={true}>{i18n.__("users.Add User")}</Button>
            </div>
          </form>
          <br />

      {/* Data listing component */}
        <GridView 
          limit={this.state.limit} 
          LimitIncFunction={this.limitIncFunction}
          searchFunction={this.searchcFunction}
          searchColumns={this.state.searchColumns}
          initialColumns={[]}
          publications={['adminAllUsers','clients']} 
          collection={Meteor.users} 
          renderComponent={'User'}
        />
          
        </div>
      );
    }
    if (!Roles.userIsInRole(currentUserId, ['super-admin', 'client-manager'])) {
      return (
        <div className="center m2">
         {i18n.__("common.You are not authorised to view this page")}
        </div>
      );
    }
  }

  // render collections
  renderClients() {
    const allClients = this.props.clients;

    return allClients.map(client => (
      <option key={client._id} value={client._id}>{client.clientName}</option>
    ));
  }



  get_client_detail = (client_id_temp) => {

    var client_details_found  =  Clients.findOne({ _id: client_id_temp });

    return client_details_found;
  }
  
  render() {
    const { status } = this.props;
    if(status.connected){
      return (
        <div className="width-narrow">
         { (!this.props.dataSubscription) ? 
        <div>
        <div className="simple-loader">
           <img src={`${publicDir}/img/loading.gif`} />
        </div>
        <div className="data-processing-message">
           <br></br>
           <b>{i18n.__("common.The data is loading please wait")}</b>
        </div></div>: this.renderUserCreateForm()}
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
  const dataSubscription = Meteor.subscribe('clients').ready();
  const user = Meteor.user();
  const query = {};

  if (user) query.clientId = user.profile.clientId;
  // const currentClient = Clients.find({_id : client.get()}).fetch()
  
  return {
    status: Meteor.status(),
    clients: Clients.find({}, { sort: [['clientName', 'asc']] }).fetch(),
    // currentClient,
    dataSubscription: dataSubscription,
  };
})(AdminUserList);
