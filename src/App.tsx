import React from 'react';
import { render } from 'react-dom';
import './App.global.css';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
// eslint-disable-next-line import/no-named-as-default
import OBS from './components/OBS';
import Preferences from './components/Preferences';
import Home from './components/Home';

// export default class App extends React.Component {
//   constructor(props: never) {
//     super(props);
//     this.state = {};
//   }

//   render() {
//     return (
//       <Router>
//         <Switch>
//           <Route path="/home" component={Home} />
//           <Route path="/obs" component={OBS} />
//           <Route path="/preferences" component={Preferences} />
//         </Switch>
//       </Router>
//     );
//   }
// }\

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/home" component={Home} />
        <Route path="/obs" component={OBS} />
        <Route path="/preferences" component={Preferences} />
      </Switch>
    </Router>
  );
}

render(<App />, document.getElementById('root'));
