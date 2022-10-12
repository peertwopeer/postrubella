import React, { Component } from "react";
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';

import '/imports/languages/en/en.report.i18n.yml';
import '/imports/languages/de/de.report.i18n.yml';
import '/imports/languages/en-JM/en-JM.report.i18n.yml';
import '/imports/languages/en-JM/en-JM.common.i18n.yml';
import '/imports/languages/en/en.common.i18n.yml';
import '/imports/languages/de/de.common.i18n.yml';


class CustomSLATimeSlotsForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            slotOneVisibility:true,
            slotTwoVisibility:true,
            slotThreeVisibility:true,
            slotFourVisibility:true,
            slotFiveVisibility:true,
            slotSixVisibility:true,
            addSlot:6
        };
    }

    addSlot = () => {
        if(this.state.addSlot == 0){
            this.setState({slotOneVisibility: true});
        }
        if(this.state.addSlot == 1){
            this.setState({slotTwoVisibility: true});
        }
        if(this.state.addSlot == 2){
            this.setState({slotThreeVisibility: true});
        }
        if(this.state.addSlot == 3){
            this.setState({slotFourVisibility: true});
        }
        if(this.state.addSlot == 4){
            this.setState({slotFiveVisibility: true});
        }
        if(this.state.addSlot == 5){
            this.setState({slotSixVisibility: true});
        }


        if(this.state.addSlot < 6){
            this.setState({addSlot: this.state.addSlot + 1});
        }
    }

    removeSlot = (slot) => {
        this.setState({addSlot: this.state.addSlot - 1});
    }

    generateReport = () => {
        let validation = true;
        let slotOneFrom = (this.state.slotOneVisibility) ? parseFloat(this.slotOneFrom.value.trim()) : -6;
        let slotOneTo = (this.state.slotOneVisibility) ? parseFloat(this.slotOneTo.value.trim()) : -5 ;
        let slotTwoFrom = (this.state.slotTwoVisibility) ? parseFloat(this.slotTwoFrom.value.trim()) : -5;
        let slotTwoTo = (this.state.slotTwoVisibility) ? parseFloat(this.slotTwoTo.value.trim()) : -4;
        let slotThreeFrom = (this.state.slotThreeVisibility) ? parseFloat(this.slotThreeFrom.value.trim()) : -4;
        let slotThreeTo = (this.state.slotThreeVisibility) ? parseFloat(this.slotThreeTo.value.trim()) : -3;
        let slotFourFrom = (this.state.slotFourVisibility) ? parseFloat(this.slotFourFrom.value.trim()) : -3;
        let slotFourTo = (this.state.slotFourVisibility) ? parseFloat(this.slotFourTo.value.trim()) : -2;
        let slotFiveFrom = (this.state.slotFiveVisibility) ? parseFloat(this.slotFiveFrom.value.trim()) : -2;
        let slotFiveTo = (this.state.slotFiveVisibility) ? parseFloat(this.slotFiveTo.value.trim()) : -1;
        let slotSixFrom = (this.state.slotSixVisibility) ? parseFloat(this.slotSixFrom.value.trim()) : -1;
        let slotSixTo = (this.state.slotSixVisibility) ? parseFloat(this.slotSixTo.value.trim()) : 0;
        let slaSlots = [
            { from: slotOneFrom, to: slotOneTo },
            { from: slotTwoFrom, to: slotTwoTo },
            { from: slotThreeFrom, to: slotThreeTo },
            { from: slotFourFrom, to: slotFourTo },
            { from: slotFiveFrom, to: slotFiveTo },
            { from: slotSixFrom, to: slotSixTo }
        ]

        // validation 
        slaSlots.forEach((slot)=>{
            if(parseFloat(slot.to) < parseFloat(slot.from)){
                alert("`From` values should not be greater than `To` values. Please check your time slots.");
                validation = false;
            }
            if(slot.to == slot.from){
                alert("`From` values should not be equel to `To` values. Please check your time slots.");
                validation = false;
            }
        });

        let valueArr = slaSlots.map(function(item) {
            return JSON.stringify(item)
         });
        let isDuplicate = valueArr.some(function(item, idx) {
            return valueArr.indexOf(item) != idx
         });
        if(isDuplicate) {
            alert("Time slots should not duplicate. Please check your time slots.");
            validation = false;
        }


        if (validation) {
            this.props.generateCustomSLA(slaSlots)
        } else {
            return false
        }
    }

    renderOptions() {
        return Array.from(Array(50).keys())
          .map((value) => value / 2)
          .map((value) => (
            <option key={value} value={value}>
              {value == 0.5 ? "30 Min" : value + " Hr"}
            </option>
          ));
      }

    render() {
        return (
            <div className="clearfix">

                <div className="col col-6 p1">
                    <h3 className="bold h3">{i18n.__('common.From')}</h3>
                </div>
                <div className="col col-6 p1">
                    <h3 className="bold h3">{i18n.__('common.To')}</h3>
                </div>
                



                {(this.state.slotOneVisibility) ?
                    <div>
                        <div className="col col-6 p1">
                            <select name="slotOneFrom" ref={c => { this.slotOneFrom = c; }} defaultValue="0">
                                {this.renderOptions()}
                            </select>
                        </div>
                        <div className="col col-6 p1 md-flex sm-flex lg-flex">
                            <select name="slotOneTo" ref={c => { this.slotOneTo = c; }} defaultValue="1">
                                {this.renderOptions()}
                            </select>
                            <IconButton onClick={() => this.setState({ slotOneVisibility: false },() => this.removeSlot(1))}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>
                    </div>
                    : ""
                }





                {(this.state.slotTwoVisibility) ?
                    <div>
                        <div className="col col-6 p1">
                            <select name="slotTwoFrom" ref={c => { this.slotTwoFrom = c; }} defaultValue="1">
                                {this.renderOptions()}
                            </select>
                        </div>
                        <div className="col col-6 p1 md-flex sm-flex lg-flex">
                            <select name="slotTwoTo" ref={c => { this.slotTwoTo = c; }} defaultValue="2">
                                {this.renderOptions()}
                            </select>
                            <IconButton onClick={() => this.setState({ slotTwoVisibility: false },() => this.removeSlot(2))}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>
                    </div>
                    : ""
                }





                {(this.state.slotThreeVisibility) ?
                    <div>
                        <div className="col col-6 p1">
                            <select name="slotThreeFrom" ref={c => { this.slotThreeFrom = c; }} defaultValue="2">
                                {this.renderOptions()}
                            </select>
                        </div>
                        <div className="col col-6 p1 md-flex sm-flex lg-flex">
                            <select name="slotThreeTo" ref={c => { this.slotThreeTo = c; }} defaultValue="3">
                                {this.renderOptions()}
                            </select>
                            <IconButton onClick={() => this.setState({ slotThreeVisibility: false },() => this.removeSlot(3))}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>
                    </div>
                    : ""
                }





                {(this.state.slotFourVisibility) ?
                    <div>
                        <div className="col col-6 p1">
                            <select name="slotFourFrom" ref={c => { this.slotFourFrom = c; }} defaultValue="3">
                                {this.renderOptions()}
                            </select>
                        </div>
                        <div className="col col-6 p1 md-flex sm-flex lg-flex">
                            <select name="slotFourTo" ref={c => { this.slotFourTo = c; }} defaultValue="4">
                                {this.renderOptions()}
                            </select>
                            <IconButton onClick={() => this.setState({ slotFourVisibility: false },() => this.removeSlot(4))}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>
                    </div>
                    : ""
                }





                {(this.state.slotFiveVisibility) ?
                    <div>
                        <div className="col col-6 p1">
                            <select name="slotFiveFrom" ref={c => { this.slotFiveFrom = c; }} defaultValue="4">
                                {this.renderOptions()}
                            </select>
                        </div>
                        <div className="col col-6 p1 md-flex sm-flex lg-flex">
                            <select name="slotFiveTo" ref={c => { this.slotFiveTo = c; }} defaultValue="5">
                                {this.renderOptions()}
                            </select>
                            <IconButton onClick={() => this.setState({ slotFiveVisibility: false },() => this.removeSlot(5))}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>
                    </div>
                    : ""
                }
                


                
                {(this.state.slotSixVisibility) ?
                    <div>
                        <div className="col col-6 p1">
                            <select name="slotSixFrom" ref={c => { this.slotSixFrom = c; }} defaultValue="5">
                                {this.renderOptions()}
                            </select>
                        </div>
                        <div className="col col-6 p1 md-flex sm-flex lg-flex">
                            <select name="slotSixTo" ref={c => { this.slotSixTo = c; }} defaultValue="6">
                                {this.renderOptions()}
                            </select>
                            <IconButton onClick={() => this.setState({ slotSixVisibility: false },() => this.removeSlot(6))}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>
                    </div>
                    : ""
                }
                




                <div className="col col-12 center">
                    <IconButton onClick={this.addSlot}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                </div>





                <div className="col col-12 center">
                    <Button onClick={this.generateReport} variant="contained" color="primary">{i18n.__('report.Generate Custom SLA')}</Button>
                </div>

                

                

            </div>
        );
    }
}

export default CustomSLATimeSlotsForm;