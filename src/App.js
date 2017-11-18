import React, {Component} from 'react';
import {Route} from 'react-router-dom';
import Main from './Main';
import Admin from './Admin';
import './App.scss';

class App extends Component {
    render() {
        return (
            <div className="app">
                <Route exact path="/" component={Main}/>
                <Route path="/admin" component={Admin}/>
            </div>
        );
    }
}

export default App;
