import 'whatwg-fetch';

import {
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Col,
  Row,
  Table
} from 'reactstrap';
import React, { Component } from 'react';

import FaBus from 'react-icons/lib/fa/bus';
import FaRefresh from 'react-icons/lib/fa/refresh';
import moment from 'moment';

export default class EnTur extends Component {
  async getDepartures() {
    const { data } = await fetch(
      'https://api.entur.org/journeyplanner/2.0/index/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ET-Client-Name': 'mathiasose-WSOGMM'
        },
        body: JSON.stringify({
          query: `{
              stopPlace(id: "${process.env.REACT_APP_ENTUR_STOP_ID}") {
                id
                name
                estimatedCalls(numberOfDepartures: 20) {
                  aimedArrivalTime
                  aimedDepartureTime
                  expectedArrivalTime
                  expectedDepartureTime
                  realtime
                  date
                  forBoarding
                  forAlighting
                  destinationDisplay {
                    frontText
                  }
                  quay {
                    id
                  }
                  serviceJourney {
                    journeyPattern {
                      line {
                        id
                        name
                        transportMode
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
      const [
        company,
        ,
        lineNo
      ] = call.serviceJourney.journeyPattern.line.id.split(':');

      if (!call.forBoarding || company !== 'RUT') {
        return;
      }

      const destination = call.destinationDisplay.frontText;
      const key = `${lineNo} - ${destination}`;

      if (departures[key] === undefined) {
        departures[key] = [];
      }

      const t = moment(call.expectedDepartureTime);

      //if (t - moment() < moment.duration(1, "minutes")) {
      //  return;
      //}

      departures[key].push(`${t.fromNow()}`);
    });

    this.setState({ name, departures, lastUpdated: moment() });

    setTimeout(this.getDepartures.bind(this), 30 * 1000);
  }

  async componentDidMount() {
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
                  <tr
                    className="table-secondary"
                    style={{ textAlign: 'center' }}
                  >
                    <th colSpan="2">{line}</th>
                  </tr>
                  <tr>
                    {this.state.departures[line]
                      .slice(0, 2)
                      .map((departure, j) => <td key={j}>{departure}</td>)}
                  </tr>
                </React.Fragment>
              ))}
          </tbody>
        </Table>
        <CardFooter style={{ fontSize: 'x-small', textAlign: 'right' }}>
          <FaRefresh /> {this.state.lastUpdated.format('LTS')}
        </CardFooter>
      </Card>
    );
  }
}
