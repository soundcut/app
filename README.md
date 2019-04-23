# Soundcut - prototype - Extract sound memes in the browser

Soundcut is a Progressive Web App which lets you to extract, share, save, download or simply listen to specific moments (a `slice` or `cut`) of a song or any audio source.

Created and developed by [Tim](https://twitter.com/tpillard).

# Features

## Audio source

- Upload an mp3 file
- Link an external media and extract its audio (using [youtube-dl](https://github.com/rg3/youtube-dl))
- Re-use an existing `slice`, saved on the server or in the browser via `indexedDB`

## Audio source manipulation

- Download audio source
- Decode the audio data to draw a waveform in a canvas
- Play (looped) / Pause
- Select `slice` boundaries (start / end) using drag and drop
- Save/delete the audio source into/from `indexedDB`

## Slice features

- Submit a slice - re-draw a waveform just for the selected boundaries
- Download a slice
- Share a slice - save the slice on the server, generate a unique URL
- Save/delete a slice into/from `indexedDB`

# Philosophy

Soundcut is a mean to experiment manipulating audio files in the browser, be privacy-focused as well as trying to avoid being network-dependant, therefore even though some operations might be more efficiently done on the server (such as decoding audio data and computing waveform points), __as much work as possible will be performed in the browser__.

# Technical Stack

Soundcut is meant to be a simple, lightweight and quickly evolving web app.
It is mainly built on top of the following tools:
- [hyperHTML](https://github.com/WebReflection/hyperHTML)
- [viperHTML](https://github.com/WebReflection/viperHTML) for SSR
- [hyperhtml-app](https://github.com/WebReflection/hyperhtml-app) for client-side routing
- [express](https://github.com/expressjs/express)
- [youtube-dl](https://github.com/rg3/youtube-dl)
- [mp3-parser](https://github.com/biril/mp3-parser)
- [postgreSQL](PostgreSQL)

## Installation & local development

```sh
nvm use
npm ci
npm run dev
```

## Deploy

```sh
npm run deploy
```

Soundcut staging is deployed to [GANDI Simple Hosting Node.js](https://www.gandi.net/en/simple-hosting)

## Useful links..

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer)
- [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)
- [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web Share Target API](https://developers.google.com/web/updates/2018/12/web-share-target)
