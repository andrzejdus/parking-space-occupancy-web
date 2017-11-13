import React, {Component} from 'react';
import {GoogleLogin, GoogleLogout} from 'react-google-login';

class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLogged: false
        };
    }

    render() {
        let button = <a href="">adas</a>;
        if (!this.state.isLogged) {
            button= <GoogleLogin
                clientId="161181123924-n2alva61mkht2mn9m1btcrsk5j795r19.apps.googleusercontent.com"
                buttonText="Login with Google"
                isSignedIn={true}
                onSuccess={this.onLoginSuccess.bind(this)}
                onFailure={this.onLoginFailed.bind(this)}
            />;
        } else {
            button= <GoogleLogout
                buttonText="Logout"
                onLogoutSuccess={this.onLogoutSuccess.bind(this)}
            />;
        }

        return (
            <span>{button}</span>
        )
    }

    onLoginSuccess(response) {
        console.log('Success, response ', response);

        this.setState({
            isLogged: true
        });
    }

    onLoginFailed(response) {
        console.log(response);

        this.setState({
            isLogged: false
        });
    }

    onLogoutSuccess(response) {

        this.setState({
            isLogged: false
        });
    }
}

export default Login;
