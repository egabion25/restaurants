
const mapStyle = [{
  'featureType': 'administrative',
  'elementType': 'all',
  'stylers': [{
    'visibility': 'on',
  },
  {
    'lightness': 33,
  },
  ],
},
{
  'featureType': 'landscape',
  'elementType': 'all',
  'stylers': [{
    'color': '#f2e5d4',
  }],
},
{
  'featureType': 'poi.park',
  'elementType': 'geometry',
  'stylers': [{
    'color': '#c5dac6',
  }],
},
{
  'featureType': 'poi.park',
  'elementType': 'labels',
  'stylers': [{
    'visibility': 'on',
  },
  {
    'lightness': 20,
  },
  ],
},
{
  'featureType': 'road',
  'elementType': 'all',
  'stylers': [{
    'lightness': 20,
  }],
},
{
  'featureType': 'road.highway',
  'elementType': 'geometry',
  'stylers': [{
    'color': '#c5c6c6',
  }],
},
{
  'featureType': 'road.arterial',
  'elementType': 'geometry',
  'stylers': [{
    'color': '#e4d7c6',
  }],
},
{
  'featureType': 'road.local',
  'elementType': 'geometry',
  'stylers': [{
    'color': '#fbfaf7',
  }],
},
{
  'featureType': 'water',
  'elementType': 'all',
  'stylers': [{
    'visibility': 'on',
  },
  {
    'color': '#acbcc9',
  },
  ],
},



];

/**
 * Use Distance Matrix API to calculate distance from origin to each store.
 * @param {google.maps.Data} data The geospatial data object layer for the map
 * @param {google.maps.LatLng} origin Geographical coordinates in latitude
 * and longitude
 * @return {Promise<object[]>} n Promise fulfilled by an array of objects with
 * a distanceText, distanceVal, and storeid property, sorted ascending
 * by distanceVal.
 */
async function calculateDistances(data, origin) {
  const stores = [];
  const destinations = [];

  // Build parallel arrays for the store IDs and destinations
  data.forEach((store) => {
    const storeNum = store.getProperty('storeid');
    const storeLoc = store.getGeometry().get();

    stores.push(storeNum);
    destinations.push(storeLoc);
  });

  // Retrieve the distances of each store from the origin
  // The returned list will be in the same order as the destinations list
  const service = new google.maps.DistanceMatrixService();
  
  const getDistanceMatrix =
    (service, parameters) => new Promise((resolve, reject) => {

      service.getDistanceMatrix(parameters, (response, status) => {
        if (status != google.maps.DistanceMatrixStatus.OK) {
          reject(response);
        } else {

          const distances = [];
          const results = response.rows[0].elements;
          for (let j = 0; j < results.length; j++) {
            const element = results[j];
            const distanceText = element.distance.text;
            const distanceVal = element.distance.value;
            const distanceObject = {
              storeid: stores[j],
              distanceText: distanceText,
              distanceVal: distanceVal,
            };
            distances.push(distanceObject);
          }

          resolve(distances);
        }
      });
    });

  const distancesList = await getDistanceMatrix(service, {
    origins: [origin],
    destinations: destinations,
    travelMode: 'DRIVING',
    unitSystem: google.maps.UnitSystem.METRIC,
  });

  distancesList.sort((first, second) => {
    return first.distanceVal - second.distanceVal;
  });

  return distancesList;
}


function sanitizeHTML(strings) {
  const entities = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'};
  let result = strings[0];
  for (let i = 1; i < arguments.length; i++) {
    result += String(arguments[i]).replace(/[&<>'"]/g, (char) => {
      return entities[char];
    });
    result += strings[i];
  }
  return result;
}

function calculateAndDisplayRoute(directionsRenderer, directionsService,
  markerArray, stepDisplay, map, routeDestination) {

      
// First, remove any existing markers from the map.
for (var i = 0; i < markerArray.length; i++) {
  markerArray[i].setMap(null);
}


directionsService.route({
  origin: pointOfOrigin,
  destination: routeDestination,
  travelMode: 'WALKING',
}, function(response, status) {
  // Route the directions and pass the response to a function to create
  // markers for each step.
  if (status === 'OK') {
    document.getElementById('warnings-panel').innerHTML =
        '<b>' + response.routes[0].warnings + '</b>';


    directionsRenderer.setDirections(response);


    showSteps(response, markerArray, stepDisplay, map);
  } else {
    window.alert('Directions request failed due to ' + status);
  }
});
}







function showSteps(directionResult, markerArray, stepDisplay, map) {
// For each step, place a marker, and add the text to the marker's infowindow.
// Also attach the marker to an array so we can keep track of it and remove it
// when calculating new routes.
var myRoute = directionResult.routes[0].legs[0];
for (var i = 0; i < myRoute.steps.length; i++) {
  var marker = markerArray[i] = markerArray[i] || new google.maps.Marker;
  marker.setMap(map);
  marker.setPosition(myRoute.steps[i].start_location);
  attachInstructionText(
      stepDisplay, marker, myRoute.steps[i].instructions, map);
}
}

function attachInstructionText(stepDisplay, marker, text, map) {
google.maps.event.addListener(marker, 'click', function() {
  // Open an info window when the marker is clicked on, containing the text
  // of the step.
  stepDisplay.setContent(text);
  stepDisplay.open(map, marker);
});
}
