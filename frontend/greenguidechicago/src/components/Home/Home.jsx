import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const LandingPage = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    min-height: 100vh;
    background-color: #f5f5f5;
`;

const Footer = styled.footer`
    text-align: center;
    padding: 5px;
    background-color: #333;
    color: #fff;
    width: 100%;
`;

const Header = styled.header`
    text-align: center;
    margin-bottom: 20px;
`;

const Main = styled.main`
    text-align: center;
    flex-grow: 1;
`;

const Buttons = styled.section`
    margin-bottom: 20px;
`;

const Button = styled.button`
    margin: 0 10px;
    padding: 10px 20px;
    font-size: 16px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    background-color: ${({ active }) => (active ? "#007bff" : "#28a745")};
    color: #fff;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: ${({ active }) => (active ? "#0056b3" : "#218838")};
    }
`;

const ResponseData = styled.section`
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const MapContainer = styled.div`
    display: ${({ active }) => (active ? 'block' : 'none')};
    width: 100vw;
    height: 600px;
    margin-bottom: 20px;
`;

const apiKey = 'AIzaSyAF545AIRMTK0DF-7klMhkfp9RuHTIatQg';

const mapStyles = {
    height: '100%',
    width: '100%',
};

const App = () => {
  
    const [activeView, setActiveView] = useState('itinerary');
    const [itinerary, setItinerary] = useState('');
    const [markers, setMarkers] = useState([]);
    const [typingEffectText, setTypingEffectText] = useState('');
    useEffect(() => {
      console.log(markers);
    }, [markers]);
    useEffect(() => {
        if (activeView === 'itinerary' && !itinerary) {
            fetchItinerary();
        }
    }, [activeView]);

    useEffect(() => {
      if (itinerary) {
          // Initialize typingEffectText with the first character of the itinerary
          setTypingEffectText(itinerary[0]);
  
          // Simulate typing effect
          let index = 1; // Start from index 1
          const typingInterval = setInterval(() => {
              setTypingEffectText(prevText => prevText + itinerary[index]);
              index++;
              if (index === itinerary.length) {
                  clearInterval(typingInterval);
              }
          }, 50); // Adjust typing speed here
          return () => clearInterval(typingInterval);
      }
  }, [itinerary]);

    const fetchItinerary = async (e) => {
        try {
          const response = await fetch('http://localhost:8000/getData', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // Add any data you want to send in the request body
            }),
          });
          const data = await response.json();
          setItinerary(data.itinerary);
        } catch (error) {
          console.error('Failed to fetch itinerary:', error);
        }
      };

    const pointCoordinates = async() => {
      toggleView('map')
        const response=await fetch("http://localhost:8000/getCoordinates",{
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        // console.log(data.location.latitude+" "+data.location.longitude);
        const newMarkers = [
          ...markers,
          { latitude: data.location.latitude, longitude: data.location.longitude },
          ...data.eventDivvys.map(divvy => ({ latitude: divvy.latitude, longitude: divvy.longitude, color:"blue" })),
          ...data.eventplaces.map(place => ({ latitude: place.latitude, longitude: place.longitude, color:"red" }))
        ];
        setMarkers(newMarkers);

        // setMarkers([...markers, { latitude: data.location.latitude, longitude: data.location.longitude }]);
        // for(var i=0;i<data.eventDivvys.length;i++){
        //   setMarkers([...markers, { latitude: data.eventDivvys[i].latitude, longitude: data.eventDivvys[i].longitude }]);
        // }


        // for(var i=0;i<data.eventplaces.length;i++){
        //   console.log(data.eventplaces[i]);
        //   setMarkers([...markers, { latitude: data.eventplaces[i].latitude, longitude: data.eventplaces[i].longitude }]);
        // }
        // console.log(data)
    };

    const toggleView = (view) => {
        setActiveView(view);
    };

    return (
        <LandingPage>
            <Header>
                <h1>Itinerary for Today</h1>
                <p>Discover Sustainable Travel Experiences in Chicago</p>
            </Header>

            <Main>
                <Buttons>
                    <Button active={activeView === 'itinerary'} onClick={() => toggleView('itinerary')}>Itinerary</Button>
                    <Button active={activeView === 'map'} onClick={pointCoordinates}>Map View</Button>
                </Buttons>

                {activeView === 'itinerary' && itinerary && (
                    <ResponseData>
                    <h2>Today's Itinerary:</h2>
                    <pre style={{ wordWrap: 'break-word' }}>{typingEffectText}</pre>
                </ResponseData>
                )}

                {activeView === 'map' && (
                    <MapContainer active={activeView === 'map'}>
                        <LoadScript googleMapsApiKey={apiKey}>
                            <GoogleMap
                                mapContainerStyle={mapStyles}
                                zoom={10}
                                center={{ lat: 41.8781, lng: -87.6298 }}
                            >
                                {markers.map((marker, index) => (
                                    <Marker
                                    key={index}
                                    color = {marker.color}
                                    position={{ lat: marker.latitude, lng: marker.longitude }}
                                />
                                ))}
                            </GoogleMap>
                        </LoadScript>
                    </MapContainer>
                )}
            </Main>

            <Footer>
                <p>&copy; {new Date().getFullYear()} All Rights Reserved.</p>
            </Footer>
        </LandingPage>
    );
};

export default App;