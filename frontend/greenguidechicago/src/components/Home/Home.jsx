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

const Home = () => {
    const [activeView, setActiveView] = useState('itinerary');
    const [itinerary, setItinerary] = useState('');
    const [markers, setMarkers] = useState([]);
    const [typingEffectText, setTypingEffectText] = useState('');

    useEffect(() => {
        if (activeView === 'itinerary' && !itinerary) {
            fetchItinerary();
        }
    }, [activeView]);

    useEffect(() => {
        if (itinerary) {
            // Simulate typing effect
            let index = 0;
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

    const fetchItinerary = async () => {
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

    const pointCoordinates = () => {
        fetch('http://localhost:8000/getCoordinates')
            .then(response => response.json())
            .then(data => {
                const newMarkers = data.map(spot => {
                    const { lat, lng, type } = spot;
                    let color;
                    switch (type) {
                        case 'divvySpots':
                            color = 'blue';
                            break;
                        case 'hotSpots':
                            color = 'red';
                            break;
                        case 'userLocation':
                            color = 'black';
                            break;
                        default:
                            color = 'black';
                    }
                    return { lat, lng, color };
                });
                setMarkers(newMarkers);
            })
            .catch(error => {
                console.error('Error fetching coordinates:', error);
            });
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
                    <Button active={activeView === 'map'} onClick={() => toggleView('map')}>Map View</Button>
                </Buttons>

                {activeView === 'itinerary' && (
                    <ResponseData>
                        <h2>Today's Itinerary:</h2>
                        <pre>{typingEffectText}</pre>
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
                                        position={{ lat: marker.lat, lng: marker.lng }}
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

export default Home;
