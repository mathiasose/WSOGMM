import 'whatwg-fetch';

import { Card, CardBody, CardSubtitle, CardText, CardTitle } from 'reactstrap';
import React, { Component } from 'react';

const JSON_URL = process.env.REACT_APP_COOP_JSON_URL;
const STORE_ID = process.env.REACT_APP_COOP_STORE_ID;

export default class Coop extends Component {
  async fetchStore() {
    const { Stores: stores } = await fetch(JSON_URL)
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

    if (stores) {
      stores.forEach(store => {
        if (store.StoreId === STORE_ID) {
          this.setState({
            store
          });
        }
      });
    }
  }

  componentDidMount() {
    if (!(JSON_URL && STORE_ID)) {
      console.error('Required env variable: REACT_APP_COOP_JSON_URL');
      console.error('Required env variable: REACT_APP_COOP_STORE_ID');
      console.info(
        'https://coop.no/StoreService/SearchStores?searchInput=POSTNR',
        'Use post number of the store you want to find.'
      );
      return;
    }
    this.fetchStore();
  }

  render() {
    if (!this.state) {
      return null;
    }

    let openingHoursToday = this.state.store.OpeningHoursToday;
    const match = openingHoursToday.match(
      /(\d{2}:\d{2}):\d{2}-(\d{2}:\d{2}):\d{2}/
    );
    if (match) {
      openingHoursToday = `${match[1]} - ${match[2]}`;
    }

    return (
      <Card className="shadow">
        <CardBody>
          <CardTitle>Coop {this.state.store.Chain}</CardTitle>
          <CardSubtitle>{this.state.store.Name}</CardSubtitle>
          <CardText>{openingHoursToday}</CardText>
        </CardBody>
      </Card>
    );
  }
}
