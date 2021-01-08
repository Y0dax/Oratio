import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import MicOffIcon from '@material-ui/icons/MicOff';

const useStyles = makeStyles({
  icon: {
    fontSize: '10rem',
    // boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
  },
  header: {
    textAlign: 'center',
  },
});

const Hello = () => {
  const classes = useStyles();
  return (
    <div>
      <div className="Hello">
        <MicOffIcon className={classes.icon} />
      </div>
      <h1 className={classes.header}>Project Oratio</h1>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Hello} />
      </Switch>
    </Router>
  );
}
