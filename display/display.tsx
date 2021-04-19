import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';
import '../src/App.global.css';

ReactDOM.hydrate(<App />, document.getElementById('root'));
