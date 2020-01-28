var map = null;
const apiKey = 'AIzaSyDSCTkiWuux0aCqgqjxfmVRBmr2N1hb2ms';

var infoWindow;
var markers = [];


var routeSource = null;
var routeDestination = null;



var markerArray = [];
var directionsService = null;
var directionsService = null;
var directionsRenderer = null;
var stepDisplay = null;
var pointOfOrigin = null;



//initial setup
function initMap() {



 if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function(position) {
   
 
    pointOfOrigin = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);


    //set to current
   initSetMap({
    lat: position.coords.latitude,
    lng: position.coords.longitude
   });
  }, function() {
   //Set to Manila
   initSetMap();
  });
 }
}



function initSetMap(coordinates ) {

  //default coordinates
  if( coordinates == undefined){
    var coordinates =  {
      lat: 14.55,
      lng: 121.001
     }
  }

 map = new google.maps.Map(document.getElementById('map'), {
  zoom: 16,
  center: coordinates,
  styles: mapStyle,
  mapTypeControlOptions: {
   style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
   position: google.maps.ControlPosition.TOP_RIGHT
  },
 });


 markerArray = [];

 // Instantiate a directions service.
 directionsService = new google.maps.DirectionsService;
  // Instantiate a directions service.
 directionsService = new google.maps.DirectionsService;
 // Instantiate an info window to hold step text.
 stepDisplay = new google.maps.InfoWindow;
  // Create a renderer for directions and bind it to the map.
  directionsRenderer = new google.maps.DirectionsRenderer({map: map});

  
 // Define the custom marker icons, using the store's "category".
 map.data.setStyle((feature) => {
  return {
   icon: {
    url: `img/icon_${feature.getProperty('category')}.png`,
    scaledSize: new google.maps.Size(64, 64),
   },
  };
 });


 buildAutocomplete(map, coordinates);

 getNearbyRestaurants(coordinates);

}


function buildAutocomplete(map, coordinates) {

 var input = buildControls(map);

 //Autosuggest nearby areas
 var autocomplete_boundary = new google.maps.LatLngBounds(
  new google.maps.LatLng(coordinates.lat - 0.0005, coordinates.lng - 0.0005),
  new google.maps.LatLng(coordinates.lat + 0.0005, coordinates.lng + .0005),
 );

 const options = {
  types: ['geocode', 'establishment'],
  strictbounds: true,
  bounds: autocomplete_boundary
 };

 const autocomplete = new google.maps.places.Autocomplete(input, options);

 autocomplete.setFields([
  'address_components', 'geometry', 'name'
 ]);


 // Set the origin point when the user selects an address
 const originMarker = new google.maps.Marker({
  map: map
 });
 originMarker.setVisible(false);
 let originLocation = map.getCenter();
 originMarker.setVisible(false);


 
 //On place changed..
 autocomplete.addListener('place_changed', async () => {


  originLocation = map.getCenter();
  const place = autocomplete.getPlace();

  $("#result-header").text("Restaurants near " + place.name);
  if (!place.geometry) {
   window.alert('No address available for input: \'' + place.name + '\'');
   return;
  }

  $("#result-place-name").text(  place.address_components[0].short_name);



  // Recenter the map to the selected address
  originLocation = place.geometry.location;
  map.setCenter(originLocation);
  map.setZoom(18);
  console.log(place);

  getNearbyRestaurants(originLocation);
  return;
 });

}

function getNearbyRestaurants(originLocation, establishment_type ) {

  // Get name of the area
   var request = {
    location: originLocation,
    radius: 1,
    type: ["locality","political"]
  };
  var service = new google.maps.places.PlacesService(map);
  service.textSearch(request, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
       $("#result-place-name").text( results[0].name );
       $("title").text("Search results around " + results[0].name  );
       $("#result-header").text("Search results near " + results[0].name);
    }
  });



  if(establishment_type == undefined){
    establishment_type = ['restaurant'];
  }

//Search for nearby stores
 var service = new google.maps.places.PlacesService(map);
 var request = {
  location: originLocation,
  radius: 500,
  types: establishment_type
 }

 service.nearbySearch(request, callback);
}


function callback(results, status) {

 var positions = [];

 if (status == google.maps.places.PlacesServiceStatus.OK) {

  showStoresList(results);

  var icon = {
   url: 'img/marker-red.png',
   size: new google.maps.Size(30, 45),
   origin: new google.maps.Point(0, 0),
   anchor: new google.maps.Point(0, 0)
  };

  //delete all previous markers
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
    markers[i] = null;
  }
  markers = [];



  for (var i = 0; i < results.length; i++) {

   markers[i] = new google.maps.Marker({
    position: results[i].geometry.location,
    icon: icon,
    size: new google.maps.Size(10, 16),
    map: map,
    place_id: results[i].place_id,
   });

   google.maps.event.addListener(markers[i], 'mouseover', (function(marker, i) {

    return function() {

     $(".marker-highlight").removeClass("marker-highlight");
     $("#store-" + marker.place_id).addClass("marker-highlight");

     var data_request = {
      placeId: marker.place_id,
      fields: ['name', 'rating', 'formatted_phone_number', 'geometry', 'type', 'opening_hours']
     };
     var service = new google.maps.places.PlacesService(map);

     service.getDetails(data_request, function(placeResult, status) {

      const name = placeResult.name;
      var isOpen = "";

      if (placeResult.opening_hours !== undefined) {

       if (placeResult.opening_hours.open_now) {
        isOpen = "Open";
       } else {
        isOpen = "Closed";
       }
      }

      var phone = placeResult.formatted_phone_number !== undefined ? placeResult.formatted_phone_number : "N/A";
      const position = placeResult.geometry.location || 'N/A';

      const content = sanitizeHTML `
                        <h5>${name}</h5>
                        <p>
                            <b>Open:</b>  ${isOpen}
                            <br/>
                            <b>Phone:</b> ${phone}
                        </p>
                            <img src="https://maps.googleapis.com/maps/api/streetview?size=350x120&location=${position.lat()},${position.lng()}&key=${apiKey}">
                       
                      `;

      if (infoWindow !== undefined) {
       infoWindow.close();
      }

      infoWindow = new google.maps.InfoWindow();
      infoWindow.setContent(content);
      infoWindow.setPosition(position);
      infoWindow.setOptions({
       pixelOffset: new google.maps.Size(0, -30)
      });
      infoWindow.open(map);
     });

    }

   })(markers[i], i));







  }












 }
}


function showStoresList(stores) {

 $("#leftPane li").empty();
 $("#leftPane").show();
 var results_list = "";
 stores.forEach((store) => {

  results_list = results_list + '<li> <div id="store-' + store.place_id + '">' +
   '<img src="' + store.icon + '">' +
   '<span class="name">' + store.name + '</span>' +
   '<p class="vicinity">' + store.vicinity + '</p>';

    if( pointOfOrigin){
      results_list = results_list + '<a href="#" position="'+ store.geometry.location +'" class="directions">Directions</a>';
    }
    
  results_list = results_list + '</div></li>';

 });

 $("#list").append(results_list);


 return;
}



function buildControls(map, options) {


 map.controls[google.maps.ControlPosition.TOP_RIGHT].push($("#pac-input")[0]);

 return $("#pac-input")[0];

}


$("#filter-restaurant" ).on("click",function(){
  getNearbyRestaurants(map.getCenter(),["restaurant"]);
});


$("#filter-hotel" ).on("click",function(){
  getNearbyRestaurants(map.getCenter(),["lodging"]);
});

$("#filter-bar" ).on("click",function(){
  getNearbyRestaurants(map.getCenter(),["bar"]);
});


$("#filter-coffee" ).on("click",function(){
  getNearbyRestaurants(map.getCenter(),["cafe"]);
});

$(document).on("click", ".directions", function(e){
  
  var position_array = $(this).attr("position").replace('(', '').replace(')','').split(",");
  
// routeSource = {
//                 lat: position_array[0],
//                 lng: position_array[1]
//               }

              routeDestination = new google.maps.LatLng(position_array[0],position_array[1]);


calculateAndDisplayRoute( directionsRenderer, directionsService, markerArray, stepDisplay, map, routeDestination );

});


