import 'whatwg-fetch';
import 'moment-duration-format';
import 'moment/locale/nb';

import {
  Card,
  CardBody,
  CardFooter,
  CardImg,
  CardSubtitle,
  CardTitle,
  Progress
} from 'reactstrap';
import React, { Component } from 'react';

import FaRandom from 'react-icons/lib/fa/random';
import FaRepeat from 'react-icons/lib/fa/repeat';
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
      device,
      progress_ms,
      repeat_state,
      shuffle_state
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
        progress_ms,
        repeat_state,
        shuffle_state,
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

  async tick() {
    if (this.state.progress_ms) {
      await this.setState({
        progress_ms: this.state.progress_ms + 1000
      });
    }
    setTimeout(this.tick.bind(this), 1000);
  }

  async componentDidMount() {
    await this.getCurrentPlaying();
    setTimeout(this.tick.bind(this), 1000);
  }

  render() {
    if (!this.state || !this.state.is_playing) {
      return null;
    }

    const progressPercentage =
      100 * this.state.progress_ms / this.state.item.duration_ms;

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
          <Progress
            animated
            value={progressPercentage}
            style={{ marginTop: '1rem' }}
          />
          <span>
            {moment
              .utc(moment.duration(this.state.progress_ms).asMilliseconds())
              .format('mm:ss')}
          </span>
          <span style={{ float: 'right' }}>
            {moment.duration(this.state.item.duration_ms).format('mm:ss')}
          </span>
        </CardBody>
        <CardFooter style={{ fontSize: 'x-small' }}>
          {this.state.repeat_state !== 'off' ? <FaRepeat /> : ''}
          &emsp;
          {this.state.shuffle_state ? <FaRandom /> : ''}
          <span style={{ float: 'right' }}>{this.state.device.name}</span>
        </CardFooter>
      </Card>
    );
  }
}
