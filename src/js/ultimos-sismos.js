const APIKEY =
  "pk.eyJ1Ijoic2hpZmZtYW4iLCJhIjoiY2xwOGxnMThxMDBvajJsbzdjdDI3NXFlOSJ9.Ytrc05lBxHAEO1OPt7zZWQ";

let streets = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
  {
    attribution:
      ' <a href="https://rmsg.netlify.app/"> Red de Monitoreo Sísmico Global </a>',
    maxZoom: 18,
    accessToken: APIKEY,
  }
);

let satelliteStreets = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
  {
    attribution:
      ' <a href="https://rmsg.netlify.app/"> Red de Monitoreo Sísmico Global </a>',
    maxZoom: 18,
    accessToken: APIKEY,
  }
);

let dark = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token={accessToken}",
  {
    attribution:
      ' <a href="https://rmsg.netlify.app/"> Red de Monitoreo Sísmico Global </a>',
    maxZoom: 18,
    accessToken: APIKEY,
  }
);

navigator.geolocation.getCurrentPosition(function (position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  map.setView([lat, lon], 7);

  console.log(lat - lon);

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
  "Placas tectónicas": tectonicPlateData,
  "Sismos graves": majorEarthquakes,
};

L.control.layers(baseMaps, overlays).addTo(map);

let customControl = L.control({
  position: "topright",
});

d3.json(
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
).then(function (data) {
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

  const magnitudes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const colors = [
    "#00FF00",
    "#ADFF2F",
    "#FFFF00",
    "#FFA500",
    "#FF0000",
    "#8B0000",
    "#800080",
    "#00008B",
    "#000000",
  ];

  function getColor(magnitude) {
    if (magnitude > 6) {
      return colors[6];
    }
    if (magnitude > 5) {
      return colors[5];
    }
    if (magnitude > 4) {
      return colors[4];
    }
    if (magnitude > 3) {
      return colors[3];
    }
    if (magnitude > 2) {
      return colors[2];
    }
    if (magnitude > 1) {
      return colors[1];
    }
    return colors[0];
  }

  function getRadius(magnitude) {
    if (magnitude > 0) {
      return magnitude * 4;
    } else {
      return "";
    }
  }

  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      console.log(feature);
      return L.circleMarker(latlng);
    },
    style: styleInfo,

    onEachFeature: function (feature, layer) {
      let timestamp = new Date(feature.properties.time);
      let formattedTime = timestamp.toLocaleString();

      layer.bindPopup(
        "Magnitud: " +
        feature.properties.mag +
        "<br>Ubicación: </>" +
        feature.properties.place +
        "<br>Fecha y Hora: " +
        formattedTime
      );
    },
  }).addTo(allEarthquakes);

  allEarthquakes.addTo(map);

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
        console.log(feature);
        return L.circleMarker(latlng);
      },
      style: styleInfo,

      onEachFeature: function (feature, layer) {
        let timestamp = new Date(feature.properties.time);
        let formattedTime = timestamp.toLocaleString();

        layer.bindPopup(
          "Magnitud: " +
          feature.properties.mag +
          "<br>Ubicación: </>" +
          feature.properties.place +
          "<br>Fecha y Hora: " +
          formattedTime
        );
      },
    }).addTo(majorEarthquakes);
    majorEarthquakes.addTo(map);
  });

  let tectonicPlates =
    "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
  d3.json(tectonicPlates).then(function (data) {
    console.log(data);
    L.geoJSON(data, {
      weight: 3,
      color: "orange",
      onEachFeature: function (feature, layer) {
        console.log(layer);
      },
    }).addTo(tectonicPlateData);
    tectonicPlateData.addTo(map);
  });

  let legend = L.control({
    position: "bottomright",
  });

  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

    for (var i = 0; i < magnitudes.length; i++) {
      console.log(colors[i]);
      div.innerHTML +=
        "<i style='background: " +
        colors[i] +
        "'></i> " +
        magnitudes[i] +
        (magnitudes[i + 1] ? "&ndash;" + magnitudes[i + 1] + "<br>" : "+");
    }
    return div;
  };

  legend.addTo(map);
});
