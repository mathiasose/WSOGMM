# Infoscreen with useful things

![WSOGMM](screenshot.png)

## How to use
- Run a browser with CORS protection disabled, e.g. `chromium-browser --disable-web-security`.
  - This lets the webpage make API requests to other sites, so that you don't need to run a http server yourself.
  - Don't use the unsafe browser for your regular browsing.
- `yarn install`
- `BROWSER=chromium-browser yarn start`
