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

const ENABLED = JSON.parse(process.env.REACT_APP_BIKE_ENABLED || 1);
const HOME_COORDINATES = JSON.parse(
  process.env.REACT_APP_HOME_COORDINATES ||
    '{"latitude":59.0, "longitude":10.0}'
);
const CLIENT_NAME = process.env.REACT_APP_BIKE_CLIENT_NAME;

async function bikeFetch(url) {
  return fetch(url, {
    method: 'GET',
    headers: {
      'client-name': CLIENT_NAME
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
      bikeFetch('https://gbfs.urbansharing.com/oslobysykkel.no/station_information.json')
        .then(
          ({ data: { stations } }) => ({ stations })
        ),
      bikeFetch('https://gbfs.urbansharing.com/oslobysykkel.no/station_status.json')
        .then(
          ({ data: { stations } }) => ({ availability: stations })
        )
    ]).catch(err => {
      console.error(err);
      return [{}, {}];
    });

    if (stations && availability) {
      const sorted = collection.sortBy(stations, s =>
        haversine(HOME_COORDINATES, { latitude: s.lat, longitude: s.lon })
      );
      const closest = array.take(sorted, 10);
      this.setState({
        stations: closest.map(station => ({
          ...station,
          ...availability.find(s => s.station_id === station.station_id)
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
    if (!ENABLED) {
      console.info('Bike widget disabled');
      return;
    }
    if (!(HOME_COORDINATES && CLIENT_NAME)) {
      console.error('Required env variable: REACT_APP_HOME_COORDINATES');
      console.error('Required env variable: REACT_APP_BIKE_CLIENT_NAME');
      console.info('https://oslobysykkel.no/apne-data/sanntid');
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
            <span
              className="float-right"
              style={{ fontSize: 'x-small', textAlign: 'right' }}
            >
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
                <tr key={i} className={station.is_renting ? '' : 'text-danger'}>
                  <th>
                    {station.is_renting ? (
                      ''
                    ) : (
                      <FaExclamationCircle
                        style={{
                          marginRight: '0.5rem',
                          verticalAlign: 'text-bottom'
                        }}
                      />
                    )}
                    {station.name || `? (${station.station_id})`}
                  </th>
                  <td
                    className={
                      station.num_bikes_available > 0
                        ? 'text-success'
                        : 'text-danger'
                    }
                    style={{ textAlign: 'right' }}
                  >
                    <FaBicycle />
                    &ensp;
                    {station.num_bikes_available}
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
