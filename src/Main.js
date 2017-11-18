import React, {Component} from 'react';
import Station from './Station';
import './main.scss';

class Main extends Component {
    render() {
        return (
            <div className={'main'}>
                <Station />
            </div>
        )
    }
}

export default Main;
