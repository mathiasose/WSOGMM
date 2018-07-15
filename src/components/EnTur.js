import 'whatwg-fetch';

import {
  Card,
  CardBody,
  CardTitle,
  Col,
  Row,
  Table
} from 'reactstrap';
import React, { Component } from 'react';

import FaBus from 'react-icons/lib/fa/bus';
import FaRefresh from 'react-icons/lib/fa/refresh';
import moment from 'moment';

const STOP_ID = process.env.REACT_APP_ENTUR_STOP_ID;
const CLIENT_NAME = process.env.REACT_APP_ENTUR_CLIENT_NAME;
const AUTHORITY = 'RUT:Authority:RUT';
const N_DEPARTURES = 20;

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
              estimatedCalls(
                numberOfDepartures: ${N_DEPARTURES},
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

    const { stopPlace: { name, estimatedCalls } } = data;

    const departures = {};

    estimatedCalls.forEach(call => {
      const lineNo = call.serviceJourney.journeyPattern.line.publicCode;
      const destination = call.destinationDisplay.frontText;
      const key = `${lineNo} - ${destination}`;

      if (departures[key] === undefined) {
        departures[key] = [];
      }

      departures[key].push(moment(call.expectedDepartureTime));
    });

    this.setState({ name, departures, lastUpdated: moment() });

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

    return (
      <Card className="shadow">
        <CardBody style={{ paddingBottom: 0 }}>
          <CardTitle>
            <Row style={{ display: 'flex', alignItems: 'center' }}>
              <Col xs="1">
                <FaBus className="fa-lg" />
              </Col>
              <Col xs="10" style={{ fontSize: 'initial' }}>
                <span className="float-right" style={{ fontSize: 'x-small', textAlign: 'right' }}>
                  <FaRefresh /> {this.state.lastUpdated.format('LTS')}
                </span>
                {this.state.name}
              </Col>
            </Row>
          </CardTitle>
        </CardBody>
        <Table size="sm" style={{ marginBottom: 0 }}>
          <tbody>
            {Object.keys(this.state.departures)
              .sort()
              .map((line, i) => (
                <React.Fragment key={i}>
                  <tr>
                    <th>{line}</th>
                    {this.state.departures[line]
                      .filter(t => (t - moment() > moment.duration(1, 'minutes')))
                      .slice(0, 2)
                      .map(t => `${t.format('HH:mm')}`)
                      .map((departure, j) => <td key={j}>{departure}</td>)}
                  </tr>
                </React.Fragment>
              ))}
          </tbody>
        </Table>
      </Card>
    );
  }
}
