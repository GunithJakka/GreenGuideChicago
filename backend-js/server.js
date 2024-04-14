const express = require("express");
const OpenAI = require("openai");
const cors = require('cors');
const ipapi = require('ipapi.co');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.listen(8000, function () {
    console.log("Server started on port 8000");
});

const openai = new OpenAI({ apiKey: "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" });

async function getLocationFromCoordinates(latitude, longitude) {
    const apiKey = 'AIzaSyAF545AIRMTK0DF-7klMhkfp9RuHTIatQg';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

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

async function getCurrentWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=apparent_temperature`;
    const response = await axios.get(url);
    const weatherData = response.data;
    return weatherData;
}

async function getLocation() {
    return new Promise((resolve, reject) => {
        ipapi.location(location => {
            resolve(location);
        });
    });
}

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

function saveStationDataToCsv(data, filename) {
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    fs.writeFileSync(filename, `${header}\n${rows}`);
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
    console.log(nearestStation);
}

async function agent(userInput) {
    const messages = [
        {
            role: "system",
            content: "You are a helpful assistant. Give me the response based on what I ask",
        },
        {
            role: "user",
            content: userInput,
        },
    ];
    
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages
    });
    return response;
}

async function getLocationWeatherAndAskAgent() {
    try {
        const location = await getLocation();
        const weather = await getCurrentWeather(location.latitude, location.longitude);
        const humanLocation = await getLocationFromCoordinates(location.latitude, location.longitude);

        const prompt = "Please suggest me 5 places around " + humanLocation + " that I can visit based on weather conditions, the temperature is " + weather.hourly.apparent_temperature[0] + "C. Give me the output as list that has {place: place, address: address} format separated by semicolon";
        
        const response = await agent(prompt);
        const text = response.choices[0].message.content;
        const places = text.split('\n').map(line => {
            const parts = line.split('; ');
            const place = parts[0].split(': ')[1];
            const address = parts[1].split(': ')[1];
            return { place, address };
        });
        
        console.log(places);
    } catch (error) {
        console.error(error);
    }
}

getLocationWeatherAndAskAgent();
