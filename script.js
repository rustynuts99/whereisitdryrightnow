document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    const cities = [];


    form.addEventListener("submit", (event) => {
        event.preventDefault(); // prevent the form from refreshing the page

        // get user inputs

        const location = document.getElementById("location").value;
        const radius = document.getElementById("radius").value;

        console.log("location", location);

        console.log("radius", radius);

        // fetchCoordinates(location);

        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${location}&format=json`;

       fetch(geocodeUrl)
        .then(response => response.json())
        .then((data) =>{
            if( data.length === 0){
                console.error("No results found for the given location.");
                return;
            }

            const resultsDiv = document.getElementById("results");
            resultsDiv.innerHTML = "";

            data.forEach((result, index) =>{
                const listItem = document.createElement("li");
                listItem.textContent = result.display_name;
                listItem.dataset.lat = result.lat;
                listItem.dataset.lon = result.lon;
                listItem.addEventListener("click", () =>{
                    console.log(`Selected: ${result.display_name}`);
                    console.log(`Latitude: ${result.lat}, Longitude: ${result.lon}`);

                    // diplay selected location
                    
                    const selectedLocationDiv = document.getElementById("selected-location");
                    selectedLocationDiv.innerHTML = `
                    <h3>Selected Location<h3>
                    <p>Name: ${result.display_name}</p>
                    <p>Long: ${result.lat}</p>
                    <p>Lat: ${result.lon}</p>

                    `;
                    resultsDiv.innerHTML = "";

                    // Call fetchWeatherData with selected lat and lon
                    fetchWeatherData(result.lat, result.lon);

                    // call bounding box function and pass user input as an arguement

                    const boundingBox = calculateBoundingBox(result.lat, result.lon, radius); 
                    fetchNearbyLocations(boundingBox);
                    console.log("bounding box", boundingBox);
                    console.log("Min Lat:", boundingBox.minLat, "Max Lat:", boundingBox.maxLat);
                    console.log("Min Lon:", boundingBox.minLon, "Max Lon:", boundingBox.maxLon);


                    
                    
                });
                resultsDiv.appendChild(listItem);
            })
        } )

        .catch(error => console.error("Error", error));

        

    })

    //  calculates a radius based on longitude and latitude 

    const calculateBoundingBox = (lat, lon, radiusInMiles) => {
        const radiusInKm = radiusInMiles * 1.60934; // Convert miles to kilometres
        const earthRadiusKm = 111; // Approx. km per degree latitude
    
        const latDelta = parseFloat((radiusInKm / earthRadiusKm).toFixed(6));
        const lonDelta = parseFloat((radiusInKm / (earthRadiusKm * Math.cos(lat * (Math.PI / 180)))).toFixed(6));

        console.log("Latitude Delta:", latDelta, "Longitude Delta:", lonDelta);

        // Ensure lat and lon are numbers
        lat = parseFloat(lat);
        lon = parseFloat(lon);
    
        const minLat = parseFloat((lat - latDelta).toFixed(6)); // Round and parse as a number
        const maxLat = parseFloat((lat + latDelta).toFixed(6));
        const minLon = parseFloat((lon - lonDelta).toFixed(6));
        const maxLon = parseFloat((lon + lonDelta).toFixed(6));
    
        console.log(`Latitude: ${lat}, Longitude: ${lon}`);
        console.log(`min lat: ${minLat} max lat: ${maxLat}`);
        console.log(`min lon: ${minLon} max lon: ${maxLon}`);
    
        return { minLat, maxLat, minLon, maxLon };
    };
    

    // Define fetchWeatherData function below the main logic
    const fetchWeatherData = (lat, lon) => {
        const apiKey = "19f5f2f5134ce3e9bd5ec5dcfeb8ffeb";
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
    
                // Show current weather (optional)
                const currentWeather = data.list[0];
                const currentTemp = currentWeather.main.temp;
                const currentDescription = currentWeather.weather[0].description;
                const currentIcon = currentWeather.weather[0].icon;
    
                const currentWeatherDiv = document.getElementById("current-weather");
                currentWeatherDiv.innerHTML = `
                    <h3>Current Weather</h3>
                    <p><strong>Temperature:</strong> ${currentTemp}°C</p>
                    <p><strong>Description:</strong> ${currentDescription}</p>
                    <img src="https://openweathermap.org/img/wn/${currentIcon}@2x.png" alt="${currentDescription}">
                `;
            })
            .catch(error => console.error("Error fetching weather data:", error));
    };

    // uses radius (boundingBox) to search for nearby locations

    const fetchNearbyLocations = (boundingBox, ) => {
        const {minLon, maxLat, maxLon, minLat} = boundingBox;

        const apiUrl = `https://nominatim.openstreetmap.org/search?q=city&format=json&bounded=1&viewbox=${minLon},${maxLat},${maxLon},${minLat}&extratags=1&addressdetails=1&limit=100`;// best so far

        fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log("Nearby locations:", data);
            data.forEach(city => {
                cities.push({
                    name: city.display_name,
                    lat: parseFloat(city.lat),
                    lon: parseFloat(city.lon),
                });
               
            });

            console.log("cities saved", cities);
        })
        .catch(error => console.error("Error fetching nearby locations", error));
    }


    //  not finished need to loop through city data 
    
    // const fetchNearbyWeatherData = (cities) => {
    //     const apiKey = "19f5f2f5134ce3e9bd5ec5dcfeb8ffeb";
    //     const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    


    //     fetch(apiUrl)
    //         .then(response => response.json())
    //         .then(data => {
    
    //             // Show current weather (optional)
    //             const currentWeather = data.list[0];
    //             const currentTemp = currentWeather.main.temp;
    //             const currentDescription = currentWeather.weather[0].description;
    //             const currentIcon = currentWeather.weather[0].icon;
    
    //             const currentWeatherDiv = document.getElementById("current-weather");
    //             currentWeatherDiv.innerHTML = `
    //                 <h3>Current Weather</h3>
    //                 <p><strong>Temperature:</strong> ${currentTemp}°C</p>
    //                 <p><strong>Description:</strong> ${currentDescription}</p>
    //                 <img src="https://openweathermap.org/img/wn/${currentIcon}@2x.png" alt="${currentDescription}">
    //             `;
    //         })
    //         .catch(error => console.error("Error fetching weather data:", error));
    // };
    
    

    

   
})