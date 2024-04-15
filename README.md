# SightCycleECO.ai

**SightCycleECO.ai** is an eco-friendly tourist guide that provides sustainable travel itineraries based on environmental considerations. This project was developed during **OraHacks**, where participants were tasked to create projects centered around Chicago within a 9-hour timeframe.

## Overview

**SightCycleECO.ai** aims to offer users sustainable travel options by curating itineraries that prioritize environmental impact. By leveraging various APIs and technologies, the application provides users with tailored itineraries based on their current location, weather conditions, nearby events, and available bike-sharing options.

## Features

- **Dynamic Itinerary Generation:** Users can request personalized itineraries based on their current location and environmental factors.
- **Weather Integration:** Utilizing the **Open Meteo API**, the application fetches current weather details and predicts weather conditions for the next 5 hours to inform itinerary planning.
- **Event Recommendations:** Using the **SerpApi**, the application retrieves nearby events sorted by proximity, allowing users to explore local happenings.
- **Bike-sharing Information:** Integrated with the **Divvy API**, the app provides details on the nearest bike-sharing station, including bike availability and docking information.
- **Map Visualization:** Users have the option to view itinerary locations and bike-sharing stations on an interactive map, enhancing navigation and planning.

## Technologies Used

- **Frontend Framework:** React
- **Backend Framework:** Node.js with Express
- **APIs:**
  - [**ipapi**](https://ipapi.com/): For retrieving user's current location based on IP address.
  - [**Open Meteo API**](https://open-meteo.com/): For fetching current weather data and predictions.
  - [**SerpApi**](https://serpapi.com/): For obtaining information about nearby events.
  - [**Divvy API**](https://www.divvybikes.com/system-data): For accessing bike-sharing station details and availability.
  - [**OpenAI API**](https://openai.com/): For generating personalized travel itineraries.

## Usage

1. Clone the repository.
2. Navigate to the project directory.
3. Install dependencies using `npm install`.
4. Start the frontend and backend servers using `npm start` for both.
5. Access the application via the provided URL.

## Achievements

- **OraHacks Winner:**  The SightCycleECO.ai project emerged victorious at OraHacks hackathon. The project stood out among 200 competitors, showcasing exceptional innovation and creativity.
- 
![Demo GIF]
(https://raw.githubusercontent.com/GunithJakka/SightCycleECO.ai/main/images/itinerary.gif)


## Contributors

-Gunith Jakka
-Pranav Kaushik Dhara
-Satwik Sinha
