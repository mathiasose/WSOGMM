import 'moment/locale/nb';

import { Card, CardColumns, Container } from 'reactstrap';
import React, { Component } from 'react';

import Bike from './components/Bike';
import Coop from './components/Coop';
import EnTur from './components/EnTur';
import FaRefresh from 'react-icons/lib/fa/refresh';
import Online from './components/Online';
import Spotify from './components/Spotify';
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
      <Container>
        <Time />
        <CardColumns>
          <Online />
          <Weather />
          <Coop />
          <Bike />
          <EnTur />
          <Card />
          <Spotify />
        </CardColumns>
        <div style={{ fontSize: 'x-small', textAlign: 'right' }}>
          <FaRefresh /> {moment().format('LTS')}
        </div>
      </Container>
    );
  }
}

export default App;
