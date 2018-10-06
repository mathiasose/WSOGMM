import 'whatwg-fetch';

import { Card, CardBody, Col, Row } from 'reactstrap';
import React, { Component } from 'react';

import moment from 'moment';

export default class Time extends Component {
  async updateTime() {
    this.setState({ time: moment() });

    setTimeout(this.updateTime.bind(this), 30 * 1000);
  }
  async componentDidMount() {
    const { weekno, dates } = await fetch('http://ukenummer.no/json')
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

    this.setState({
      time: moment(),
      week: {
        number: weekno,
        from: moment(dates.fromdate_iso),
        to: moment(dates.todate_iso)
      }
    });

    await this.updateTime();
  }

  render() {
    if (!this.state) {
      return null;
    }

    return (
      <Card
        inverse
        style={{
          margin: '0 auto 0.5rem auto',
          backgroundColor: '#666',
          borderColor: '#666'
        }}
        className="shadow"
      >
        <CardBody style={{ padding: '0.25rem 0.5rem' }}>
          <Row style={{ display: 'flex', alignItems: 'center' }}>
            <Col xs="5">{this.state.time.format('dddd LL')}</Col>
            <Col xs="2" style={{ textAlign: 'center', fontSize: 'xx-large' }}>
              {this.state.time.format('LT')}
            </Col>
            <Col xs="5" style={{ textAlign: 'right' }}>
              Uke {this.state.week.number}:&ensp;
              {this.state.week.from.format(
                'Do MMMM'
              )}&nbsp;&ndash;&nbsp;{this.state.week.to.format('Do MMMM')}
            </Col>
          </Row>
        </CardBody>
      </Card>
    );
  }
}
