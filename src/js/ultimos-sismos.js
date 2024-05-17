const APIKEY =
  "pk.eyJ1Ijoic2hpZmZtYW4iLCJhIjoiY2xwOGxnMThxMDBvajJsbzdjdDI3NXFlOSJ9.Ytrc05lBxHAEO1OPt7zZWQ";

let streets = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
  {
    attribution:
      ' <a href="https://rgmsm.netlify.app/"> Red Global de Monitoreo Sísmico y Meteorológico </a>',
    maxZoom: 18,
    accessToken: APIKEY,
  }
);

let satelliteStreets = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
  {
    attribution:
      ' <a href="https://rgmsm.netlify.app/"> Red Global de Monitoreo Sísmico y Meteorológico </a>',
    maxZoom: 18,
    accessToken: APIKEY,
  }
);

let dark = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token={accessToken}",
  {
    attribution:
      ' <a href="https://rgmsm.netlify.app/"> Red Global de Monitoreo Sísmico y Meteorológico </a>',
    maxZoom: 18,
    accessToken: APIKEY,
  }
);

navigator.geolocation.getCurrentPosition(function (position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  map.setView([lat, lon], 7);

  console.log('Latitud:', lat);
  console.log('Longitud:', lon);
  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${APIKEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.features && data.features.length > 0) {
        var address = data.features[0].place_name;
        console.log('Lugar:', address);
      } else {
        console.error('No se encontró ninguna dirección para estas coordenadas.');
      }
    })
    .catch(error => {
      console.error('Error al obtener la dirección:', error);
    });

  const userIcon = L.icon({
    iconUrl: '../../src/img/usuario.webp',
    iconSize: [30, 30],
  });

  L.marker([lat, lon], { icon: userIcon }).addTo(map).bindPopup("¡Estás aquí!").openPopup();
});


let baseMaps = {
  Calles: streets,
  Satélite: satelliteStreets,
  Oscuro: dark,
};

let map = L.map("mapid", {
  center: [40.7, -94.5],
  zoom: 3,
  layers: [streets],
});

let allEarthquakes = new L.LayerGroup();
let tectonicPlateData = new L.LayerGroup();
let majorEarthquakes = new L.LayerGroup();

let overlays = {
  Sismos: allEarthquakes,
  "Sismos graves": majorEarthquakes,
  "Placas tectónicas": tectonicPlateData,
};

L.control.layers(baseMaps, overlays).addTo(map);

let customControl = L.control({
  position: "topright",
});

d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson").then(function (data) {
  function styleInfo(feature) {
    return {
      opacity: 1,
      fillOpacity: 1,
      fillColor: getColor(feature.properties.mag),
      radius: getRadius(feature.properties.mag),
      stroke: true,
      weight: 0.5,
    };
  }

  function getColor(magnitude) {
    const colors = [
      "#00FF00",
      "#ADFF2F",
      "#FFFF00",
      "#f5de63",
      "#f59c40",
      "#e65457",
      "#9e5766",
      "#FFA500",
      "#ff40ff",
      "#8B00FF"
    ];
    if (magnitude >= 9) return colors[9];
    if (magnitude >= 8) return colors[8];
    if (magnitude >= 7) return colors[7];
    if (magnitude >= 6) return colors[6];
    if (magnitude >= 5) return colors[5];
    if (magnitude >= 4) return colors[4];
    if (magnitude >= 3) return colors[3];
    if (magnitude >= 2) return colors[2];
    if (magnitude >= 1) return colors[1];
    return colors[0];
  }

  function getRadius(magnitude) {
    return magnitude > 0 ? magnitude * 4 : 1;
  }

  let filteredData = data.features.filter(feature => feature.properties.mag > 3);

  let magnitudeCount = {};
  filteredData = filteredData.filter(feature => {
    let mag = Math.floor(feature.properties.mag);
    if (!magnitudeCount[mag]) {
      magnitudeCount[mag] = 0;
    }
    if (magnitudeCount[mag] < 2) {
      magnitudeCount[mag]++;
      return true;
    }
    return false;
  });

  let earthquakeTable = document.querySelector('#earthquakeTable tbody');
  let earthquakeRows = {};

  L.geoJson(filteredData, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng);
    },
    style: styleInfo,
    onEachFeature: function (feature, layer) {
      let timestamp = new Date(feature.properties.time);
      let formattedTime = timestamp.toLocaleString();
      let id = feature.id;

      layer.bindPopup(
        "Magnitud: " + feature.properties.mag +
        "<br>Epicentro: " + feature.properties.place +
        "<br>Fecha y Hora: " + formattedTime
      );

      const row = document.createElement('tr');
      const color = getColor(feature.properties.mag);
      row.innerHTML = `
              <td style="color: ${color}">${feature.properties.mag}</td>
              <td>${feature.properties.place}</td>
              <td>${formattedTime}</td>
          `;
      row.id = `earthquake-${id}`;
      earthquakeTable.appendChild(row);
      earthquakeRows[id] = row;

      layer.on('click', function () {
        Object.values(earthquakeRows).forEach(r => r.classList.remove('highlight'));
        if (earthquakeRows[id]) {
          earthquakeRows[id].classList.add('highlight');
          earthquakeRows[id].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    },
  }).addTo(allEarthquakes);

  allEarthquakes.addTo(map);

  function addLegend() {
    const legendContainer = document.getElementById('legend');
    const ranges = [
      { min: 3, max: 4 },
      { min: 4, max: 5 },
      { min: 5, max: 6 },
      { min: 6, max: 7 },
      { min: 7, max: 8 },
      { min: 8, max: 9 },
      { min: 9, max: 10 }
    ];

    ranges.forEach(range => {
      const circleColor = getColor((range.min + range.max) / 2);
      const legendCircle = document.createElement('div');
      legendCircle.className = 'legend-circle';

      const circle = document.createElement('div');
      circle.className = 'circle';
      circle.style.backgroundColor = circleColor;

      const label = document.createElement('span');
      label.textContent = `Mag ${range.min}-${range.max}`;

      legendCircle.appendChild(circle);
      legendCircle.appendChild(label);
      legendContainer.appendChild(legendCircle);
    });
  }


  let majorEarthquakeData =
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson";

  d3.json(majorEarthquakeData).then(function (data) {
    function styleInfo(feature) {
      return {
        opacity: 1,
        fillColor: getColor(feature.properties.mag),
        fillOpacity: 1,
        color: "#000000",
        radius: getRadius(feature.properties.mag),
        stroke: true,
        weight: 3,
      };
    }

    L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng);
      },
      style: styleInfo,

      onEachFeature: function (feature, layer) {
        let timestamp = new Date(feature.properties.time);
        let formattedTime = timestamp.toLocaleString();

        layer.bindPopup(
          "Magnitud: " +
          feature.properties.mag +
          "<br>Epicentro: </>" +
          feature.properties.place +
          "<br>Fecha y Hora: " +
          formattedTime
        );
      },
    }).addTo(majorEarthquakes);
    majorEarthquakes.addTo(map);
    addLegend();
  });

  let tectonicPlates =
    "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
  d3.json(tectonicPlates).then(function (data) {

    L.geoJSON(data, {
      weight: 3,
      color: "orange",
    }).addTo(tectonicPlateData);
    tectonicPlateData.addTo(map);
  });
});