import 'whatwg-fetch';

import { Card, CardBody, CardSubtitle, CardTitle, Table } from 'reactstrap';

import { Component } from 'react';
import FaSunO from 'react-icons/lib/fa/sun-o';
import React from 'react';
import XML from 'pixl-xml';

const FORECAST_URL = process.env.REACT_APP_YR_API_FORECAST_URL;

export default class Weather extends Component {
  async getWeatherInfo() {
    const weatherState = yrWeatherData => ({
      from: new Date(yrWeatherData.from).toLocaleTimeString('nb-NO', {
        hour: '2-digit'
      }),
      to: new Date(yrWeatherData.to).toLocaleTimeString('nb-NO', {
        hour: '2-digit'
      }),
      temperature: yrWeatherData.temperature.value,
      wind: {
        speed: yrWeatherData.windSpeed.mps,
        direction: yrWeatherData.windDirection.code
      },
      precipitation: yrWeatherData.precipitation.value
    });

    const { forecast, sun, location } = await fetch(FORECAST_URL)
      .then(async response => {
        if (response.status !== 200) {
          return Promise.reject(response);
        }
        return XML.parse(await response.text());
      })
      .catch(err => {
        console.error(err);
        return {};
      });

    // const { latitude, longitude } = data.location.location;

    // const shortsDay = await fetch(
    //   `https://shortsdag.no/api/forecast/${latitude}/${longitude}/`
    // ).then(async response => response.json());

    this.setState({
      location,
      weather: forecast.tabular.time.slice(0, 4).map(weatherState),
      sun: {
        rise: new Date(sun.rise).toLocaleTimeString('nb-NO', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        set: new Date(sun.set).toLocaleTimeString('nb-NO', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    });

    setTimeout(this.getWeatherInfo.bind(this), 30 * 60 * 1000);
  }

  async componentDidMount() {
    if (!FORECAST_URL) {
      console.error('Required env variable: REACT_APP_YR_API_FORECAST_URL');
      console.info('http://om.yr.no/info/verdata/free-weather-data/');
      return;
    }
    await this.getWeatherInfo();
  }

  render() {
    if (!this.state) {
      return null;
    }

    return (
      <Card className="shadow">
        <CardBody>
          <CardTitle style={{ marginBottom: 0 }}>
            {this.state.location.name}
          </CardTitle>
          <CardSubtitle />
        </CardBody>

        <Table size="sm" style={{ marginBottom: 0 }}>
          <tbody>
            <tr className="table-secondary">
              <th colSpan="4" style={{ textAlign: 'center' }}>
                <FaSunO />
                &emsp;
                {this.state.sun.rise} - {this.state.sun.set}
              </th>
            </tr>
            {this.state.weather.map((when, i) => {
              return (
                <tr key={i}>
                  <th>
                    {when.from} - {when.to}
                  </th>
                  <td align="right">{when.temperature}°C</td>
                  <td align="right">{when.wind.speed} m/s</td>
                  <td align="left">{when.wind.direction}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    );
  }
}
