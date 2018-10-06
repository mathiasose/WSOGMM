import 'whatwg-fetch';

import { Card, CardBody, CardTitle, Col, Row, Table } from 'reactstrap';
import React, { Component } from 'react';

import FaBus from 'react-icons/lib/fa/bus';
import FaRefresh from 'react-icons/lib/fa/refresh';
import moment from 'moment';

const STOP_ID = process.env.REACT_APP_ENTUR_STOP_ID;
const CLIENT_NAME = process.env.REACT_APP_ENTUR_CLIENT_NAME;
const AUTHORITY = 'RUT:Authority:RUT';

export default class EnTur extends Component {
  async getDepartures() {
    const { data } = await fetch(
      'https://api.entur.org/journeyplanner/2.0/index/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ET-Client-Name': CLIENT_NAME
        },
        body: JSON.stringify({
          query: `{
            stopPlace(id: "${STOP_ID}") {
              name
              quays {
                id
                name
                estimatedCalls(
                  numberOfDepartures: 20,
                  numberOfDeparturesPerLineAndDestinationDisplay: 3,
                  omitNonBoarding: true,
                  whiteListed: {authorities: ["${AUTHORITY}"]}
                ) {
                  expectedDepartureTime
                  destinationDisplay {
                    frontText
                  }
                  serviceJourney {
                    journeyPattern {
                      line {
                        publicCode
                      }
                    }
                  }
                }
              }
            }
          }`,
          variables: null,
          operationName: null
        })
      }
    )
      .then(async response => {
        if (response.status !== 200) {
          return Promise.reject(response);
        }
        return response.json();
      })
      .catch(err => {
        console.error(err);
        return {};
      });

    if (!data) {
      return;
    }

    const {
      stopPlace: { name, quays }
    } = data;

    const quayDepartures = {};

    quays.forEach(quay => {
      const departures = {};
      quay.estimatedCalls.forEach(call => {
        const lineNo = call.serviceJourney.journeyPattern.line.publicCode;
        const destination = call.destinationDisplay.frontText;
        const key = `${lineNo} - ${destination}`;

        if (departures[key] === undefined) {
          departures[key] = [];
        }

        departures[key].push({
          lineNo,
          destination,
          t: moment(call.expectedDepartureTime)
        });
      });
      quayDepartures[quay.id] = departures;
    });

    this.setState({ name, quays: quayDepartures, lastUpdated: moment() });

    setTimeout(this.getDepartures.bind(this), 30 * 1000);
  }

  async componentDidMount() {
    if (!(STOP_ID && CLIENT_NAME)) {
      console.error('Required env variable: REACT_APP_ENTUR_STOP_ID');
      console.error('Required env variable: REACT_APP_ENTUR_CLIENT_NAME');
      console.info('http://www.entur.org/dev/api/');
      return;
    }
    await this.getDepartures();
  }

  render() {
    if (!this.state) {
      return null;
    }

    const { quays, lastUpdated, name } = this.state;
    const num_quays = Object.keys(quays).length;

    return (
      <Card className="shadow">
        <CardBody style={{ paddingBottom: 0 }}>
          <CardTitle>
            <Row style={{ display: 'flex', alignItems: 'center' }}>
              <Col xs="1">
                <FaBus className="fa-lg" />
              </Col>
              <Col xs="10" style={{ fontSize: 'initial' }}>
                <span
                  className="float-right"
                  style={{ fontSize: 'x-small', textAlign: 'right' }}
                >
                  <FaRefresh /> {lastUpdated.format('LTS')}
                </span>
                {name}
              </Col>
            </Row>
          </CardTitle>
        </CardBody>
        <Table size="sm" style={{ marginBottom: 0 }}>
          <tbody>
            {Object.keys(quays)
              .sort((a, b) => {
                const _a = Object.keys(quays[a])
                  .map(o => o.lineNo)
                  .sort();
                const _b = Object.keys(quays[b])
                  .map(o => o.lineNo)
                  .sort();

                if (_a > _b) {
                  return 1;
                } else if (_a < _b) {
                  return -1;
                }
                return 0;
              })
              .map((quay_id, i) => {
                const quay = quays[quay_id];
                return (
                  <React.Fragment key={i}>
                    {Object.keys(quay).map((line_id, j) => {
                      const departuresToShow = quay[line_id]
                        .map(o => o.t)
                        .filter(
                          t => t - moment() > moment.duration(1, 'minutes')
                        )
                        .filter(t => t - moment() < moment.duration(2, 'hour'))
                        .slice(0, 2);

                      if (departuresToShow.length === 0) {
                        return null;
                      }

                      return (
                        <tr key={j}>
                          <th>{line_id}</th>
                          {departuresToShow.map((t, k) => (
                            <td key={k}>{`${t.format('HH:mm')}`}</td>
                          ))}
                        </tr>
                      );
                    })}
                    {i < num_quays - 1 ? (
                      <tr>
                        <td colSpan="3" />
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
          </tbody>
        </Table>
      </Card>
    );
  }
}
