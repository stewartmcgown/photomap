let html = {
    spinner: `<svg class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
            </svg>`,
    spinner_small: `<svg class="spinner spinner-small" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
            </svg>`,
    mdswitch: `<input type="checkbox" id="id-name--1" name="set-name" class="switch-input">
    <label for="id-name--1" class="switch-label">Switch <span class="toggle--on">On</span><span class="toggle--off">Off</span></label>`,
    dots: `<div class="ellipses">
    <span class="one">.</span><span class="two">.</span><span class="three">.</span>
  </div>`,
    placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==',
    loading: `<div class="loading">
    <svg class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
        <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
    </svg>
</div>`,
    google: `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48"><defs><path id="a" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></defs><clipPath id="b"><use xlink:href="#a" overflow="visible"/></clipPath><path clip-path="url(#b)" fill="#FBBC05" d="M0 37V11l17 13z"/><path clip-path="url(#b)" fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z"/><path clip-path="url(#b)" fill="#34A853" d="M0 37l30-23 7.9 1L48 0v48H0z"/><path clip-path="url(#b)" fill="#4285F4" d="M48 48L17 24l-4-3 35-10z"/></svg>`
}

const get = (p, o, r = null) =>
    p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : r, o)

// Other constants
const MAX_GEOCODE_CONNECTIONS = 10

// Client ID and API key from the Developer Console
const API_KEY = 'AIzaSyBLjH1zVUY5zh3NM65NqRVP3eQxZy6ifcA';
const CLIENT_ID = '257316982603-nr1g6o1icrqoiaui4rrhu31865ph11r3.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.photos.readonly';
