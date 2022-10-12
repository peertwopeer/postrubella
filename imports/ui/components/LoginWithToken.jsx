import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';



const publicDir = `${Meteor.settings.public.cdn}/public`;

class LoginWithToken extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };

  }

  routeLogin() {
    FlowRouter.go('/login');
  }

  routeHome() {
    FlowRouter.go('/');
  }
  
  componentDidMount() {
      if((typeof this.props.token.length == 'undefined') || (this.props.token.length < 4)){
          alert("Please provide a token");
          return;
      }else{
        Meteor.loginWithToken(this.props.token, (Error) => {
            if (Error){
                var error = Error.message;
                var formattedError = error.substring(0, error.length - 5);
                alert(formattedError);
                this.routeLogin();
            }else{
                this.routeHome();
            }
         })
      }
  }

  render() {
    return (<div><div className="simple-loader"><img src={`${publicDir}/img/loading.gif`} /></div><div className="data-processing-message"><br></br><b>{ i18n.__('common.The data is loading please wait') }</b></div></div>);
  }

  }

export default withTracker(() => ({}))(LoginWithToken);
