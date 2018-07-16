import 'whatwg-fetch';

import { Card, CardBody, CardTitle, Table } from 'reactstrap';
import React, { Component } from 'react';
import FaBicycle from 'react-icons/lib/fa/bicycle';
import FaExclamationCircle from 'react-icons/lib/fa/exclamation-circle';
import FaRefresh from 'react-icons/lib/fa/refresh';
import array from 'lodash/array';
import collection from 'lodash/collection';
import haversine from 'haversine';
import moment from 'moment';

const HOME_COORDINATES = JSON.parse(process.env.REACT_APP_HOME_COORDINATES || '{"latitude":59.0, "longitude":10.0}');
const CLIENT_IDENTIFIER = process.env.REACT_APP_BIKE_CLIENT_IDENTIFIER;

async function bikeFetch(url) {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Client-Identifier': CLIENT_IDENTIFIER
    }
  }).then(response => {
    if (response.status !== 200) {
      return Promise.reject(response);
    }
    return response.json();
  });
}

export default class Bike extends Component {
  async fetchData() {
    const [{ stations }, { availability }] = await Promise.all([
      bikeFetch('https://oslobysykkel.no/api/v1/stations'),
      bikeFetch('https://oslobysykkel.no/api/v1/stations/availability').then(
        data => {
          return { availability: data.stations };
        }
      )
    ]).catch(err => {
      console.error(err);
      return [{}, {}];
    });

    if (stations && availability) {
      const sorted = collection.sortBy(stations, (s) => haversine(HOME_COORDINATES, s.center));
      const closest = array.take(sorted, 10);
      this.setState({
        stations: closest.map(station => ({
          ...station,
          ...availability.find(s => s.id === station.id)
        })),
        lastUpdated: moment(),
        error: false
      });
    } else {
      this.setState({
        lastUpdated: moment(),
        error: true
      });
    }

    setTimeout(this.fetchData.bind(this), 60 * 1000);
  }

  async componentDidMount() {
    if (!(HOME_COORDINATES && CLIENT_IDENTIFIER)) {
      console.error('Required env variable: REACT_APP_HOME_COORDINATES');
      console.error('Required env variable: REACT_APP_BIKE_CLIENT_IDENTIFIER');
      console.info('https://developer.oslobysykkel.no/api');
      return;
    }
    await this.fetchData();
  }

  render() {
    if (!this.state) {
      return null;
    }

    return (
      <Card className="shadow">
        <CardBody style={{ paddingBottom: 0 }}>
          <CardTitle>
            <span className="float-right" style={{ fontSize: 'x-small', textAlign: 'right' }}>
              <FaRefresh /> {this.state.lastUpdated.format('LTS')}
            </span>
            <FaBicycle /> Bysykkel
          </CardTitle>
        </CardBody>

        <Table size="sm" style={{ marginBottom: 0 }}>
          <tbody>
            {this.state.error ? (
              <tr className="table-danger text-center">
                <th>
                  <FaExclamationCircle /> Error
                </th>
              </tr>
            ) : (
              this.state.stations.map((station, i) => (
                <tr key={i} className={station.in_service ? '' : 'text-danger'}>
                  <th>
                    {station.in_service ? '' : <FaExclamationCircle style={{marginRight: '0.5rem', verticalAlign: 'text-bottom'}} />}
                    {station.title || `? (${station.id})`}
                  </th>
                  <td className={station.availability.bikes > 0 ? 'text-success' : 'text-danger'} style={{textAlign: 'right'}}>
                    <FaBicycle />
                    &ensp;
                    {station.availability.bikes}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    );
  }
}