
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
};

