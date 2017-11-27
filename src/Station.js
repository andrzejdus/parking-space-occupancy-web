import React, {Component} from 'react';
import socket from 'socket.io-client';
import './station.scss';

class Station extends Component {
    constructor(props) {
        super(props);

        this.state = { isOccupied: null };

        const io = socket('/');
        function subscribeToTimer(callback) {
            io.on('station', (station) => {callback(station)});
        }

        subscribeToTimer((station) => {
            console.log(station.data);
            this.setState({ isOccupied: station.data.isOccupied })
        });
    }

    render() {
        let isOccupiedValue = 'POBIERANIE';
        console.log('Is station occupied?', this.state.isOccupied);
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
}

export default Station;
