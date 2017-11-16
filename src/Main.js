import React, {Component} from 'react';
import Station from './Station';

class Main extends Component {
    render() {
        return (
            <div>
                <Station />
                <div><a href="/admin">Admin</a></div>
            </div>
        )
    }
}

export default Main;
