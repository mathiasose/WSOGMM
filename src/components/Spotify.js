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

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
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
      const scope = encodeURIComponent(
        'user-read-currently-playing user-read-playback-state'
      );
      const redirect_uri = encodeURI(window.location.href.split('#')[0]);
      const authorize_url = `https://accounts.spotify.com/api/authorize?client_id=${CLIENT_ID}&scope=${scope}&redirect_uri=${redirect_uri}&response_type=token`;

      window.location.href = authorize_url;
    }
  }

  async invalidateSpotifyToken() {
    window.sessionStorage.removeItem('SPOTIFY_ACCESS_TOKEN');
    SPOTIFY.setAccessToken(undefined);
  }

  async getColorsFromAlbumArt(url) {
    const palette = await Vibrant.from(url).getPalette();
    const primaryColor =
      palette.DarkMuted || palette.Muted || palette.LightMuted;
    const secondaryColor =
      palette.DarkVibrant || palette.Vibrant || palette.LightVibrant;
    const textColor = primaryColor.getTitleTextColor();

    return {
      primary: primaryColor.getHex(),
      secondary: secondaryColor.getHex(),
      text: textColor
    };
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
      const albumArt = item.album.images[0].url;
      const colors = await this.getColorsFromAlbumArt(albumArt);

      this.setState({
        is_playing,
        item,
        device,
        progress_ms,
        repeat_state,
        shuffle_state,
        colors
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
    if (!CLIENT_ID) {
      console.error('Required env variable: REACT_APP_SPOTIFY_CLIENT_ID');
      console.info('https://developer.spotify.com/web-api/user-guide/');
      return;
    }
    await this.getCurrentPlaying();
    setTimeout(this.tick.bind(this), 1000);
  }

  render() {
    if (!this.state || !this.state.is_playing) {
      return null;
    }

    const progressPercentage = Math.round(
      100 * this.state.progress_ms / this.state.item.duration_ms
    );

    return (
      <Card
        style={{
          backgroundColor: this.state.colors.primary,
          color: this.state.colors.text,
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
            value={progressPercentage}
            style={{
              marginTop: '1rem',
              height: '2px',
              backgroundColor: this.state.colors.text
            }}
            color="info"
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
