import 'whatwg-fetch';

import { Card, CardBody, CardSubtitle, CardText, CardTitle } from 'reactstrap';
import React, { Component } from 'react';

export default class Coop extends Component {
  async componentDidMount() {
    const { Stores } = await fetch(process.env.REACT_APP_COOP_JSON_URL)
      .then(response => {
        if (response.status !== 200) {
          return Promise.reject(response);
        }
        return response.json();
      })
      .catch(err => {
        console.error(err);
        return {};
      });

    Stores.forEach(store => {
      if (store.StoreId === process.env.REACT_APP_COOP_STORE_ID) {
        this.setState({
          store
        });
      }
    });
  }

  render() {
    if (!this.state) {
      return null;
    }

    return (
      <Card className="shadow">
        <CardBody>
          <CardTitle>Coop {this.state.store.Chain}</CardTitle>
          <CardSubtitle>{this.state.store.Name}</CardSubtitle>
          <CardText>{this.state.store.OpeningHoursToday}</CardText>
        </CardBody>
      </Card>
    );
  }
}
