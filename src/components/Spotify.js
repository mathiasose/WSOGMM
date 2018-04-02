import 'whatwg-fetch';
import 'moment-duration-format';
import 'moment/locale/nb';

import {
  Card,
  CardBody,
  CardFooter,
  CardImg,
  CardSubtitle,
  CardTitle
} from 'reactstrap';
import React, { Component } from 'react';

import SpotifyWebApi from 'spotify-web-api-js';
import Vibrant from 'node-vibrant';
import moment from 'moment';
import queryString from 'query-string';

const SPOTIFY = new SpotifyWebApi();

export default class Spotify extends Component {
  async setUpSpotify() {
    if (SPOTIFY.getAccessToken()) {
      return;
    }

    const access_token =
      queryString.parse(window.location.hash).access_token ||
      window.sessionStorage.getItem('SPOTIFY_ACCESS_TOKEN');

    if (access_token) {
      window.sessionStorage.setItem('SPOTIFY_ACCESS_TOKEN', access_token);
      SPOTIFY.setAccessToken(access_token);

      window.location.hash = '';
    } else {
      const client_id = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
      const scope = encodeURIComponent(
        'user-read-currently-playing user-read-playback-state'
      );
      const redirect_uri = encodeURI(window.location.href.split('#')[0]);
      const authorize_url = `https://accounts.spotify.com/api/authorize?client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&response_type=token`;

      window.location.href = authorize_url;
    }
  }

  async invalidateSpotifyToken() {
    window.sessionStorage.removeItem('SPOTIFY_ACCESS_TOKEN');
    SPOTIFY.setAccessToken(undefined);
  }

  async getCurrentPlaying() {
    if (!SPOTIFY.getAccessToken()) {
      await this.setUpSpotify();
    }

    const {
      is_playing,
      item,
      device
    } = await SPOTIFY.getMyCurrentPlaybackState().catch(async err => {
      if (err.status === 401) {
        await this.invalidateSpotifyToken();
        await this.setUpSpotify();
        return {};
      }
      throw err;
    });

    if (is_playing) {
      const palette = await Vibrant.from(item.album.images[0].url).getPalette();
      const primary = palette.Muted || palette.LightMuted || palette.DarkMuted;
      const contrast = primary.getTitleTextColor();

      this.setState({
        is_playing,
        item,
        device,
        colors: {
          primary: primary.getHex(),
          contrast: contrast
        }
      });
    } else {
      this.setState({ is_playing });
    }

    setTimeout(this.getCurrentPlaying.bind(this), 10 * 1000);
  }

  async componentDidMount() {
    await this.getCurrentPlaying();
  }

  render() {
    if (!this.state || !this.state.is_playing) {
      return null;
    }

    return (
      <Card
        style={{
          backgroundColor: this.state.colors.primary,
          color: this.state.colors.contrast,
          border: 'none'
        }}
        className="shadow"
      >
        <CardImg
          top
          width="100%"
          src={this.state.item.album.images[0].url}
          alt={this.state.item.album.name}
        />
        <CardBody>
          <CardSubtitle>{this.state.item.artists[0].name}</CardSubtitle>
          <CardTitle>{this.state.item.name}</CardTitle>
          <CardSubtitle>{this.state.item.album.name}</CardSubtitle>
        </CardBody>
        <CardFooter style={{ fontSize: 'x-small' }}>
          <span>
            {moment.duration(this.state.item.duration_ms).format('mm:ss')}
          </span>
          <span style={{ float: 'right' }}>{this.state.device.name}</span>
        </CardFooter>
      </Card>
    );
  }
}
