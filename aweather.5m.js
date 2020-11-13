#!/usr/bin/env /Users/choopes/.nvm/versions/node/v10.15.0/bin/node
// MODIFY:     ^^^^^^^^^ This path above should be the path to your node executable.

// Modify the token here
const token = 'p6gZKCQCZo4fSUfgimKWa3sLFWLH27oBS5sy_999999';

// Modify these airports
const airports = ['KBFI', 'KRNT', 'KSEA', 'KPWT', 'KPAE', 'KAWO', 'KSHN', 'KBVS', 'KHQM', 'KOLM', 'KCLS'];

// Modify this timezone
const timeZone = 'America/Los_Angeles';

const bitbar = require('bitbar');
const fetch = require('node-fetch');
const { utcToZonedTime, format } = require('date-fns-tz');

(async () => {

  const url = `https://avwx.rest/api/`;
  const options = '?options=&airport=true&reporting=true&format=json&onfail=cache';

  const weathers = [];
  for (let i = 0; i < airports.length; i++) {
    const response = await
      fetch(`${url}/metar/${airports[i]}${options}`, {
        headers: { 'Authorization': token }
      });

    const json = await response.json();
    weathers.push(json);
  };

  const repr = (val, preText, postText) => {
    if (!val) return '';
    return `${preText || ''}${val.repr}${postText || ''}`;
  }

  const bitbars = weathers.map((airport) => {

    let cloudCeiling = '';
    airport.clouds.some(cloud => {
      if (cloud.type === 'BKN' || cloud.type === 'OVC') {
        cloudCeiling = cloud.repr;
        return true;
      }
    });

    const date = airport.time.dt;
    const zonedDate = utcToZonedTime(date, timeZone);
    const pattern = 'd.M.yyyy HH:mm (z)';
    const pacificDate = format(zonedDate, pattern, { timeZone });

    const val = {
      text: `${airport.station} ${airport.flight_rules} ${cloudCeiling} ${repr(airport.time)}`,
      font: 'Operator Mono Bold',
      size: '17'
    };
    switch (airport.flight_rules) {
      case 'VFR':
        val.color = '#00FF00';
        break;
      case 'MVFR':
        val.color = '#0000FF';
        break;
      case 'IFR':
        val.color = '#DF00FE';
        break;
      case 'LIFR':
        val.color = '#FF00FF';
        break;
    }

    const cloudMap = airport.clouds.map((cloud) => (
      {
        text: `Layer: ${repr(cloud)}`,
        color: val.color,
        font: 'Operator Mono Bold',
        size: '17'
      }));

    val.submenu = [
      {
        text: `Visibility: ${repr(airport.visibility)}SM`,
        color: '#FFFFFF',
        font: 'Operator Mono Bold',
        size: '17'
      },
      {
        text: `Wind: ${repr(airport.wind_direction)} @ ${repr(airport.wind_speed)}kts ${repr(airport.wind_gusts, 'G')}`,
        color: '#FFFFFF',
        font: 'Operator Mono Bold',
        size: '17'
      },
      ...cloudMap,
      {
        text: `Temp: ${repr(airport.temperature)}/${repr(airport.dewpoint)}`,
        color: '#FFFFFF',
        font: 'Operator Mono Bold',
        size: '17'
      },
      {
        text: `Alt: ${repr(airport.altimeter)} inHg`,
        color: '#FFFFFF',
        font: 'Operator Mono Bold',
        size: '17'
      },
      {
        text: `Time: ${pacificDate}`,
        color: '#00BFFF',
        font: 'Operator Mono Bold',
        size: '17'
      },
    ];



    return val;
  });

  bitbar([
    {
      ...bitbars[0], submenu: [],
    },
    bitbar.separator,
    ...bitbars,
  ]);

})();
