const express = require("express");
const OpenAI = require("openai");
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
var ipapi = require('ipapi.co');
app.listen(8000, function () {
    console.log("Server started on port 8000");
});
const axios = require('axios');

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


const openai = new OpenAI({ apiKey: "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" });

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

const messages = [
    {
        role: "system",
        content:"You are a helpful assistant. Give me the response based on what I ask",
    },
];

async function agent(userInput) {
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
    try {
        const location = await getLocation();
        const weather = await getCurrentWeather(location.latitude, location.longitude);
        const humanLocation = await getLocationFromCoordinates(location.latitude, location.longitude);

        // console.log("Location:", humanLocation); // Log the human-readable location

        const prompt = "Please suggest me 5 places around " + humanLocation + "that I can visit based on weather conditions,the temperature is " + weather.hourly.apparent_temperature[0] + "C. Give me the output as list that has {place:place,address:address} format seperated by semicolon";
        //   console.log(weather.hourly.apparent_temperature[0]);
        const respone = await agent(prompt);
        // const jsons=JSON.parse(respone.choices[0].message.content);
        // console.log(respone.choices[0].message.content)
        const text=respone.choices[0].message.content;
        const places = text.split('\n').map(line => {
            const parts = line.split('; ');
            const place = parts[0].split(': ')[1];
            const address = parts[1].split(': ')[1];
            return { place, address };
        });
        
        console.log(places);

        // console.log(text);
        // Now you can use humanLocation in your further logic or return it if needed
    } catch (error) {
        console.error(error);
    }
}


//   getLocationAndLog();
getLocationWeatherAndAskAgent();