import React, { Component }             from 'react';
import PropTypes                        from 'prop-types';
import { Meteor }                       from 'meteor/meteor';
import { withTracker }                  from 'meteor/react-meteor-data';
import _                                from 'lodash';
import Button                           from '@material-ui/core/Button';
import { DeliveryTypes }                from '/imports/api/deliveryTypes.js';
import { Clients }                      from '/imports/api/clients.js';

// deliveryType list + adding collection
class DeliveryTypeAssign extends Component {

  constructor(props){
     super(props);

     this.state = {
       hide_btn : false,
       assigned_client : 0,
       assigned_delivery_type : 0,
       current_assigned_delivery_type : "",
       current_assigned_client : "",
       deliveryTypeList : [
         "Bag",
         "Box",
         "Case of Drink",
         "Envelope",
         "Envelope A4",
         "Flowers",
         "Food",
         "Fruits",
         "Jiffy Bag",
         "Large Box",
         "Letter",
         "Magazines",
         "Milk",
         "Mixed Consignment",
         "Newspapers",
         "Package",
         "Parcel",
         "Passport",
         "PC Monitor",
         "PC Tower",
         "Personal",
         "Royal Mail",
         "Small Box",
         "Tube",
       ],
       clientList : [],
       delivery_type_assigned_list : []
     }
  }

  componentWillUnmount() {
  }


  handleSubmit = async () => {
    this.setState({
      hide_btn : true
    });

    await (this.props.clients).map( async (client, index) =>  {
      // console.log('Client : ', client._id);
      this.setState({
        assigned_client : ++(this.state.assigned_client),
        current_assigned_client: client.clientName,
        assigned_delivery_type : 0
      });
      await (this.state.deliveryTypeList).map( async (deliveryType, index) =>  {
        // console.log('deliveryType', deliveryType);
        this.setState({
          current_assigned_delivery_type : deliveryType,
        });


        await DeliveryTypes.insert({
          deliveryTypeName: deliveryType,
          clientId: client._id,
          owner: Meteor.userId(),
          username: Meteor.user().username,
          createdAt: new Date(),
        });

        var temp_array = this.state.delivery_type_assigned_list;

        temp_array.push({
          clientname : client.clientName,
          delivery_type : deliveryType
        });

        this.setState({
          delivery_type_assigned_list : temp_array,
          assigned_delivery_type : ++(this.state.assigned_delivery_type),
          current_assigned_delivery_type : ''
        });
      });
    });
  };

  render() {



    return (
      <div className="width-narrow">

      {
        (!this.state.hide_btn)?
          <div className="form-row" align="center">
            <Button
            onClick={this.handleSubmit}
            fullWidth={true}
            color="primary"
            variant="contained"
            >
            Assign
            </Button>
          </div>
        :
          null
      }
      <br />
      <h5>Total No of Client { this.props.clients.length} ...... | {this.state.assigned_client}'s ({this.state.current_assigned_client}) Client to  assigned {this.state.assigned_delivery_type} ({this.state.current_assigned_delivery_type})  Delivery Type </h5>
      <br /><br />
      <table>
        <tr>
          <th>Client Name</th>
          <th>Delivery Type</th>
        </tr>
        {
          this.state.delivery_type_assigned_list.map((data) => (
            <tr>
              <td>{data.clientname.trim()}</td>
              <td>{data.delivery_type.trim()}</td>
            </tr>
          ))
        }
      </table>

      </div>
    );
  }
}
// props
DeliveryTypeAssign.propTypes = {
  deliveryTypes: PropTypes.array.isRequired,
};



// container
export default withTracker(() => {
  Meteor.subscribe('deliveryTypes');
  Meteor.subscribe('clients');

  return {
    deliveryTypes: DeliveryTypes.find({}, { sort: [['deliveryTypeName', 'asc']] }).fetch(),
    clients: Clients.find({}, { sort: [['clientName', 'asc']] }).fetch()
  };
})(DeliveryTypeAssign);
