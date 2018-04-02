import 'whatwg-fetch';

import { Card, CardBody, CardSubtitle, CardTitle, Table } from 'reactstrap';

import { Component } from 'react';
import FaSunO from 'react-icons/lib/fa/sun-o';
import React from 'react';
import XML from 'pixl-xml';

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

    const { forecast, sun, location } = await fetch(
      process.env.REACT_APP_YR_API_FORECAST_URL
    )
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
    await this.getWeatherInfo();
  }

  render() {
    if (!this.state) {
      return null;
    }

    return (
      <Card className="shadow">
        <CardBody>
          <CardTitle>{this.state.location.name}</CardTitle>
          <CardSubtitle>
            <FaSunO /> &ensp;
            {this.state.sun.rise} - {this.state.sun.set}
          </CardSubtitle>
        </CardBody>
        <Table size="sm" style={{ marginBottom: 0 }}>
          <tbody>
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
