import 'moment/locale/nb';

import { CardColumns, Container } from 'reactstrap';
import React, { Component } from 'react';

import Bike from './components/Bike';
import Coop from './components/Coop';
import EnTur from './components/EnTur';
import Online from './components/Online';
import Time from './components/Time';
import Weather from './components/Weather';
import dotenv from 'dotenv';
import moment from 'moment';

dotenv.config();

const MOMENT_LOCALE = process.env.REACT_APP_MOMENT_LOCALE;
if (MOMENT_LOCALE) {
  moment.locale(MOMENT_LOCALE);
} else {
  console.info(
    'Use optional env variable REACT_APP_MOMENT_LOCALE to change locale for time strings'
  );
}

class App extends Component {
  render() {
    return (
      <Container fluid style={{ paddingTop: '15px' }}>
        <Time />
        <CardColumns>
          <Online />
          <Weather />
          <Coop />
          <Bike />
          <EnTur />
        </CardColumns>
      </Container>
    );
  }
}

export default App;
