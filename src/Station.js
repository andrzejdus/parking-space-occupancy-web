import React, {Component} from 'react';
import './station.scss';


class Station extends Component {
    constructor(props) {
        super(props);

        this.state = { isOccupied: null };

        this.updateStationData();
    }

    render() {
        let isOccupiedValue = 'POBIERANIE';
        console.log(this.state.isOccupied);
        if (this.state.isOccupied) {
            isOccupiedValue = 'ZAJĘTĘ';
        } else if (!this.state.isOccupied) {
            isOccupiedValue =  'WOLNE';
        }

        return (
            <section className={'station'}>
                <h1 className={'station__title'}>Stanowisko</h1>
                <div className={'station__id'}>1</div>
                <div className={'station__state'}>{isOccupiedValue}</div>
            </section>
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
