document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    const cities = [];
    const cityWeatherData = [];


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

        const maxRadius = 100;
        const validRadius = Math.min(Math.max(1, radiusInMiles), maxRadius);

        if (validRadius !== radiusInMiles) {
            console.log(`Radius adjusted to ${validRadius} miles (max: ${maxRadius})`);
        }
    

        const radiusInKm = validRadius * 1.60934; // Convert miles to kilometres
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
            fetchNearbyWeatherData()
        })
        .catch(error => console.error("Error fetching nearby locations", error));
    }



    const fetchNearbyWeatherData = async () => {
        const weatherPromises = cities.map(city => fetchWeatherForCity(city.lat, city.lon));
    
        try {
            const weatherData = await Promise.all(weatherPromises);
    
            const enrichedCityData = cities.map((city, index) => ({
                ...city,
                weather: weatherData[index], // Combine city with weather
            }));
    
            console.log("Enriched City Weather Data:", enrichedCityData);
    
            // Display the data
            // displayNearbyWeather(enrichedCityData);

            const categorisedCities = categoriseCities(enrichedCityData);
            displayCategorisedCities(categorisedCities);



    
        } catch (error) {
            console.error("Error fetching weather data for nearby cities:", error);
        }
    };
    
    


    const fetchWeatherForCity = async (lat, lon) => {
        const apiKey = "19f5f2f5134ce3e9bd5ec5dcfeb8ffeb";
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
    
            // Use the first entry from the forecast list
            const currentWeather = data.list[0];
            return {
                temp: currentWeather.main.temp,
                description: currentWeather.weather[0].description,
                icon: currentWeather.weather[0].icon,
            };
        } catch (error) {
            console.error("Error fetching weather data:", error);
            return null;
        }
    };
    
    

    const categoriseCities = (cities) => {
        // Add a null check to prevent errors
        const shitCities = cities.filter(city => 
            city.weather && 
            city.weather.description && 
            city.weather.description.toLowerCase().includes("rain")
        );
        
        const notShitCities = cities.filter(city => 
            city.weather && 
            city.weather.description && 
            !city.weather.description.toLowerCase().includes("rain")
        );
    
        return { shitCities, notShitCities };
        // Return an object with both arrays
    }

    const displayCategorisedCities = (categorisedCities) => {

        const { shitCities, notShitCities} = categorisedCities; 

        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = ""; // clear previous results

        //  create columns

        const shitColumn = document.createElement("div");
        shitColumn.innerHTML = "<h3>Shit Cities (Rain)</h3>";

        const notShitColumn = document.createElement("div");
        notShitColumn.innerHTML = "<h3>Not Shit Cities (No Rain)</h3>";

        // populate shit cities

        shitCities.forEach(city => {
            const cityDiv = document.createElement("div");
            cityDiv.innerHTML = `
            <p>${city.name}</p>
            <p>${city.weather.temp}</p>
            <p>${city.weather.description}</p>
            <img src="https://openweathermap.org/img/wn/${city.weather.icon}@2x.png" alt="${city.weather.description}">`;

            shitColumn.appendChild(cityDiv);
        });

        notShitCities.forEach(city => {
            const cityDiv = document.createElement("div");
            cityDiv.innerHTML = `
            <p>${city.name}</p>
            <p>${city.weather.temp}</p>
            <p>${city.weather.description}</p>
            <img src="https://openweathermap.org/img/wn/${city.weather.icon}@2x.png" alt="${city.weather.description}">`;

            notShitColumn.appendChild(cityDiv);
        });

        // add columns to results

        resultsDiv.appendChild(shitColumn);
        resultsDiv.appendChild(notShitColumn);

        
    }
    
    
    
    

    

   
})