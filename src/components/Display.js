import { Button, ButtonGroup, Card, CardBody } from 'reactstrap';
import React, { Component } from 'react';

import FaDown from 'react-icons/lib/fa/arrow-circle-down';
import FaLightbulb from 'react-icons/lib/fa/lightbulb-o';
import FaUp from 'react-icons/lib/fa/arrow-circle-up';

const LIGHT_CONTROL_URL = 'http://localhost:8080/';

async function getBrightness() {
  return await fetch(LIGHT_CONTROL_URL)
    .then(async response => {
      if (response.status !== 200) {
        return Promise.reject(response);
      }
      return { brightness: parseInt(response.text(), 10) };
    })
    .catch(err => {
      console.error(err);
      return {};
    });
}

async function postBrightness(value) {
  return await fetch(LIGHT_CONTROL_URL, {
    method: 'POST',
    body: value
  })
    .then(async response => {
      if (response.status !== 200) {
        return Promise.reject(response);
      }
      return { brightness: parseInt(response.text(), 10) };
    })
    .catch(err => {
      console.error(err);
      return {};
    });
}

export default class Display extends Component {
  async componentDidMount() {
    const { brightness } = await getBrightness();
    this.setState({ brightness });
  }

  async clickBulb() {
    const { brightness } = await postBrightness(this.state.brightness === 255 ? 11 : 255);
    this.setState({ brightness });
  }

  async clickUp() {
    const { brightness } = await postBrightness(this.state.brightness + 10);
    this.setState({ brightness });
  }

  async clickDown() {
    const { brightness } = await postBrightness(this.state.brightness - 10);
    this.setState({ brightness });
  }

  render() {
    if (!this.state) {
      return null;
    }

    return (
      <Card
        style={{
          backgroundColor: 'transparent',
          borderColor: 'transparent'
        }}
      >
        <CardBody style={{ textAlign: 'center', padding: '1rem 0 0 0' }}>
          <ButtonGroup>
            <Button
              outline
              color="default"
              size="lg"
              onClick={this.clickBulb.bind(this)}
            >
              <FaLightbulb size={30} />
            </Button>
            <Button
              outline
              color="default"
              size="lg"
              onClick={this.clickUp.bind(this)}
            >
              <FaUp size={30} />
            </Button>
            <Button
              outline
              color="default"
              size="lg"
              onClick={this.clickDown.bind(this)}
            >
              <FaDown size={30} />
            </Button>
          </ButtonGroup>
        </CardBody>
      </Card>
    );
  }
}
