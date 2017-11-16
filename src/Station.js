import React, {Component} from 'react';
import './station.scss';


class Station extends Component {
    constructor(props) {
        super(props);

        this.state = {};

        this.updateStationData();
    }

    render() {
        return (
            <div className={'station'}>Stanowisko <span>1</span> <span>{this.state.isOccupied ? 'ZAJĘTĘ' : 'WOLNE'}</span></div>
        )
    }

    updateStationData() {
        fetch('/station/18fe34d3f4c9')
            .then((response) => (response.json()))
            .then((json) => {
                console.log(json.data.stationStatus == 'occupied');
                this.setState({isOccupied: json.data.stationStatus == 'occupied' ? true : false})
            });
    }
}

export default Station;
