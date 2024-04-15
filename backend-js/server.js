const express = require("express");
const OpenAI = require("openai");
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
var ipapi = require('ipapi.co');

require('dotenv').config();

// Now you can access your environment variables using process.env
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
// Now you can access your environment variables using process.env


app.listen(8000, function () {
    console.log("Server started on port 8000");
});
const axios = require('axios');

async function getLocationFromCoordinates(latitude, longitude) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await axios.get(url);
        const result = response.data;
        if (result.status === 'OK' && result.results.length > 0) {
            const location = result.results[0].formatted_address;
            return location;
        } else {
            throw new Error('Unable to geocode coordinates');
        }
    } catch (error) {
        throw new Error('Failed to fetch location data');
    }
}

async function getLocationCoordinates(location) {
    const encodedLocation = encodeURIComponent(location);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
  
    try {
      const response = await axios.get(url);
      const result = response.data;
      if (result.status === 'OK' && result.results.length > 0) {
        const { lat, lng } = result.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
      } else {
        throw new Error('Unable to geocode location');
      }
    } catch (error) {
        // console.log(error)
      throw new Error('Failed to fetch location data');
    }
  }


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getLocation() {
    return new Promise((resolve, reject) => {
        ipapi.location(location => {
            resolve(location);
        });
    });
}


async function getCurrentWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=apparent_temperature`;
    const response = await fetch(url);
    const weatherData = await response.json();
    return weatherData;
}



async function agent(userInput) {
    const messages = [
        {
            role: "system",
            content: "You are a helpful assistant. Give me the response based on what I ask",
        },
    ];
    messages.push({
        role: "user",
        content: userInput,
    });
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages
    });
    return response


}


async function getLocationWeatherAndAskAgent() {
    
}


//   getLocationAndLog();







async function fetchStationInformation() {
    const response = await fetch('https://gbfs.divvybikes.com/gbfs/en/station_information.json');
    const stationsInfoJson = await response.json();

    const stationIdMapping = new Map();
    stationsInfoJson.data.stations.forEach((station, index) => {
        stationIdMapping.set(station.station_id, index + 1);
    });

    return stationIdMapping;
}

async function fetchAndSaveDivvyData() {
    const stationsResponse = await fetch('https://gbfs.divvybikes.com/gbfs/en/station_status.json');
    const stationsInfoResponse = await fetch('https://gbfs.divvybikes.com/gbfs/en/station_information.json');

    const stationsJson = await stationsResponse.json();
    const stationsInfoJson = await stationsInfoResponse.json();

    const stationIdMapping = await fetchStationInformation();

    updateStationInfo(stationsInfoJson, stationIdMapping);
    updateStationStatus(stationsJson, stationIdMapping);

    const divvyStationsRealtimeStatus = processStationData(stationsJson, stationsInfoJson);
    return divvyStationsRealtimeStatus;
}

function updateStationInfo(stationInfoJson, stationIdMapping) {
    stationInfoJson.data.stations = stationInfoJson.data.stations.filter(station =>
        stationIdMapping.has(station.station_id)
    );
}

function updateStationStatus(statusJson, stationIdMapping) {
    statusJson.data.stations = statusJson.data.stations.filter(station =>
        stationIdMapping.has(station.station_id)
    );
}

function processStationData(stationsJson, stationsInfoJson) {
    const stations = stationsJson.data.stations;
    const stationsInfo = stationsInfoJson.data.stations;

    const divvyStationsRealtimeStatus = [];
    stations.forEach(station => {
        const matchingInfo = stationsInfo.find(info => info.station_id === station.station_id);
        if (matchingInfo) {
            const row = {
                altitude: 0,
                availableBikes: parseInt(station.num_bikes_available),
                availableDocks: parseInt(station.num_docks_available),
                city: 'Chicago',
                id: station.station_id,
                is_renting: !!station.is_renting,
                kioskType: matchingInfo.has_kiosk,
                landMark: 'Chicago',
                lastCommunicationTime: new Date(parseInt(station.last_reported) * 1000).toISOString(),
                latitude: parseFloat(matchingInfo.lat),
                location: 'Chicago',
                longitude: parseFloat(matchingInfo.lon),
                postalCode: 60602,
                stAddress1: 'Chicago',
                stAddress2: 'Chicago',
                stationName: matchingInfo.name,
                status: 'IN_SERVICE',
                statusKey: 1,
                statusValue: 'IN_SERVICE',
                testStation: false,
                totalDocks: parseInt(matchingInfo.capacity)
            };
            divvyStationsRealtimeStatus.push(row);
        }
    });

    return divvyStationsRealtimeStatus;
}



async function fetchNearestDivvy(lat, long) {
    const divvyStationsRealtimeStatus = await fetchAndSaveDivvyData();

    divvyStationsRealtimeStatus.forEach(station => {
        const stationLat = parseFloat(station.latitude);
        const stationLong = parseFloat(station.longitude);
        const distance = Math.sqrt(Math.pow(lat - stationLat, 2) + Math.pow(long - stationLong, 2));
        station.distance = distance;
    });

    divvyStationsRealtimeStatus.sort((a, b) => a.distance - b.distance);
    const nearestStation = divvyStationsRealtimeStatus[0];
    // console.log(nearestStation);
    return nearestStation;
    // console.log(nearestStation);
}


let globalLocation = null;
let globalEventplaces = null;
let globalUserNearestDivvy = null;
let globalEventDivvys = null;
app.post("/getData", async function(req, res) {
    getLocationWeatherAndAskAgent();
    try {
        const location = await getLocation();
        globalLocation=location;
        const weather = await getCurrentWeather(location.latitude, location.longitude);
        const humanLocation = await getLocationFromCoordinates(location.latitude, location.longitude);

        var prompt = "Please suggest me 5 places around " + humanLocation + "that I can visit based on weather conditions,the temperature is " + weather.hourly.apparent_temperature[0] + "C. Give me the output as list that has {place:place,address:address} format separated by semicolon";
        prompt+="For example the response should be in this format\n";
        prompt+="1. Place: {place}; Address: {address}\n";
        prompt+="2. Place: {place}; Address: {address}\n"
        prompt+="3. Place: {place}; Address: {address}\n"
        prompt+="4. Place: {place}; Address: {address}\n"
        prompt+="5. Place: {place}; Address: {address}\n"

        const respone = await agent(prompt);
        const text=respone.choices[0].message.content;
        const places = text.split('\n').map(line => {
            const parts = line.split('; ');
            const place = parts[0].split(': ')[1];
            const address = parts[1].split(': ')[1];
            return { place, address };
        });

        const eventplaces=[]
        for(var i=0;i<places.length;i++){
            const lat=(await getLocationCoordinates(places[i].address)).latitude;
            const long=(await getLocationCoordinates(places[i].address)).longitude
            eventplaces.push({"latitude":lat,"longitude":long});
        }
        globalEventplaces=eventplaces;

        // Get nearest Divvy station for the user
        const userNearestDivvy=await fetchNearestDivvy(location.latitude, location.longitude);
        globalUserNearestDivvy=userNearestDivvy;
        // Get Divvy stations for each event place
        const eventDivvys=[]
        for(var i=0;i<eventplaces.length;i++){
            const eventDivvysResp=await fetchNearestDivvy(eventplaces[i].latitude, eventplaces[i].longitude);
            eventDivvys.push(eventDivvysResp);
        }
        globalEventDivvys=eventDivvys;
        const futureWeather=[]
        for(var i=1;i<6;i++){
            futureWeather.push(weather.hourly.apparent_temperature[i]);
        }
        // Call getItenary after fetching all data
        const itinerary=await getItenary(humanLocation,places,location,eventplaces,eventDivvys,userNearestDivvy,futureWeather);
        // res.json({ "itinerary":itinerary });

        // console.log(itinerary)
        res.send({ itinerary: itinerary });
    } catch (error) {
        console.error(error);
    }
})




async function getItenary(humanLocation,places,location,eventplaces,eventDivvys,userNearestDivvy,futureWeather){

    // console.log(userNearestDivvy)
    var prompt="I am at "+humanLocation+" and this is my nearest divvy location " +userNearestDivvy.stationName+" and I want to visit\n";

    for(var i=0;i<places.length;i++){
        prompt+=(i+1)+"."+places[i].place+" \n";
    }
    prompt+="and for these places, these are the nearest divvy station locations\n";
    for(var i=0;i<eventDivvys.length;i++){
        prompt+=(i+1)+"."+eventDivvys[i].stationName+" \n";
        // console.log(eventDivvys[i])
    }
    prompt+="and these are the predicted temperatures for the next 5 hours\n";

    for(var i=0;i<futureWeather.length;i++){
        prompt+=(i+1)+"."+futureWeather[i]+" C \n";
        // console.log(eventDivvys[i])
    }

    prompt+="Give me an itinerary for this that is organized and describe it based on weather in 7 points."

    const respone = await agent(prompt);
    const text=respone.choices[0].message.content;
    return text;
}

app.get("/getCoordinates", function(req, res) {
    res.json({
        location: globalLocation,
        eventplaces: globalEventplaces,
        userNearestDivvy: globalUserNearestDivvy,
        eventDivvys: globalEventDivvys
    });
});