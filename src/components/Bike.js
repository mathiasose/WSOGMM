import 'whatwg-fetch';

import { Card, CardBody, CardFooter, CardTitle, Table } from 'reactstrap';
import React, { Component } from 'react';
import FaBicycle from 'react-icons/lib/fa/bicycle';
import FaExclamationCircle from 'react-icons/lib/fa/exclamation-circle';
import FaLock from 'react-icons/lib/fa/lock';
import FaRefresh from 'react-icons/lib/fa/refresh';
import moment from 'moment';

const STATION_IDS = JSON.parse(process.env.REACT_APP_BIKE_STATION_IDS || '[]');
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
      this.setState({
        stations: STATION_IDS.map(id => ({
          ...stations.find(station => station.id === id),
          ...availability.find(station => station.id === id)
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
    if (!(STATION_IDS && CLIENT_IDENTIFIER)) {
      console.error('Required env variable: REACT_APP_BIKE_STATION_IDS');
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
                    {station.in_service ? '' : <FaExclamationCircle />}
                    {station.title}
                  </th>
                  <td>
                    <FaBicycle />
                    &ensp;
                    {station.availability.bikes}
                  </td>
                  <td>
                    <FaLock />
                    &ensp;
                    {station.availability.locks}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        <CardFooter style={{ fontSize: 'x-small', textAlign: 'right' }}>
          <FaRefresh /> {this.state.lastUpdated.format('LTS')}
        </CardFooter>
      </Card>
    );
  }
}
