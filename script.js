document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    const cities = [];
    const cityWeatherData = [];


    // reset cities
    const resetButton = document.getElementById('resetButton');
    console.log("Reset button found:", resetButton); // Add this line
    resetButton.addEventListener("click", () => {
        console.log("Reset button clicked");
        // clesar cities
        cities.length = 0;
        console.log("Cities array cleared:", cities);
        document.getElementById("current-weather").innerHTML = "";
        document.getElementById("results").innerHTML = "";

        form.reset();


    });


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

             // Create title
                const title = document.createElement("h3");
                title.textContent = "Search Results";
                title.className ="text-2xl font-bold text-gray-800 mb-2";
                resultsDiv.appendChild(title);

                // Create subtitle
                const subtitle = document.createElement("p");
                subtitle.textContent = "Select the correct city:";
                subtitle.className ="text-xl text-gray-800 mb-2";
                resultsDiv.appendChild(subtitle);

            // displays local cities and allows the user to select the correct one

            data.forEach((result, index) =>{

            
                const listItem = document.createElement("li");
                console.log("result", data)
                listItem.textContent = result.display_name;
                listItem.dataset.lat = result.lat;
                listItem.dataset.lon = result.lon;
                listItem.addEventListener("click", () =>{

                    // Call fetchWeatherData with selected lat and lon
                    fetchWeatherData(result.lat, result.lon, result.display_name);

                    // call bounding box function and pass user input as an arguement

                    const boundingBox = calculateBoundingBox(result.lat, result.lon, radius); 
                    fetchNearbyLocations(boundingBox);
                    
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
    
        return { minLat, maxLat, minLon, maxLon };
    };
    

    const fetchWeatherData = (lat, lon, locationName) => {
        fetch(`https://weather-app-k2qd.onrender.com/weather?lat=${lat}&lon=${lon}`)
            .then(response => response.json())
            .then(data => {
                // Show current weather (optional)
                const currentWeather = data.list[0];
                const currentTemp = currentWeather.main.temp;
                const currentDescription = currentWeather.weather[0].description;
                const currentIcon = currentWeather.weather[0].icon;

                
    
                const currentWeatherDiv = document.getElementById("current-weather");
                console.log('Current weather div:', currentWeatherDiv);  // Debug log

                currentWeatherDiv.innerHTML = `
                    <div class="bg-orange-200 shadow-md rounded-lg p-4 mb-4 border-4 border-black-800">
                    <h3 class="text-xl font-bold mb-4 text-center">Current Weather in ${locationName}</h3>
                        <div class="text-center">
                            <p class="mb-2"><span class="font-semibold">Temperature:</span> ${currentTemp}°C</p>
                            <p class="mb-2"><span class="font-semibold">Description:</span> ${currentDescription}</p>
                            <img src="https://openweathermap.org/img/wn/${currentIcon}@2x.png" alt="${currentDescription}"
                            class="mx-auto">
                            </div>
                        </div>
                            
                `;
            })
            .catch(error => console.error("Error fetching weather data:", error));
    };

    // uses radius (boundingBox) to search for nearby locations

    const fetchNearbyLocations = (boundingBox, ) => {
        const {minLon, maxLat, maxLon, minLat} = boundingBox;

        const apiUrl = `https://nominatim.openstreetmap.org/search?q=city&format=json&bounded=1&viewbox=${minLon},${maxLat},${maxLon},${minLat}&extratags=1&addressdetails=1&limit=50`;// best so far

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
    
    // fetches weather for city

    const fetchWeatherForCity = async (lat, lon) => {
        try {
            const response = await fetch(`https://weather-app-k2qd.onrender.com/weather?lat=${lat}&lon=${lon}`);
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

        // Only show flex layout if both columns have content

        // Adjust layout based on which columns have content
        const categoriesContainer = document.createElement('div');
        categoriesContainer.className = (shitCities.length > 0 && notShitCities.length > 0) ? 
        "flex gap-8 justify-center max-w-4xl mx-auto" : 
        "max-w-2xl mx-auto";

        const shitColumn = document.createElement("div");
        const notShitColumn = document.createElement("div");

        if (shitCities.length > 0 && notShitCities.length > 0) {
            
        // Both columns

        shitColumn.className = notShitColumn.className = "w-96 min-h-[200px] p-4";
        shitColumn.innerHTML = "<h3 class='text-xl font-bold mb-4 text-center'>Shit Cities (Rain)</h3>";
        notShitColumn.innerHTML = "<h3 class='text-xl font-bold mb-4 text-center'>Not Shit Cities (No Rain)</h3>";
        resultsDiv.appendChild(shitColumn);
        resultsDiv.appendChild(notShitColumn);
        } else if (shitCities.length > 0) {

        // Only rainy cities

        shitColumn.className = "w-full min-h-[200px] p-4";
        shitColumn.innerHTML = `<h3 class='text-xl font-bold mb-4 text-center'>Shit Cities (Rain)</h3>
        <p class='text-center text-gray-600 italic mb-4'>Bad luck! Only rainy cities found!</p>`;
        resultsDiv.appendChild(shitColumn);
        } else {

        // Only non-rainy cities

        notShitColumn.className = "w-full min-h-[200px] p-4";
        notShitColumn.innerHTML = `<h3 class='text-xl font-bold mb-4 text-center'>Not Shit Cities (No Rain)</h3>
        <p class='text-center text-gray-600 italic mb-4'>Great News! No rainy cities found!</p>`;
        resultsDiv.appendChild(notShitColumn);
        }

        // sort shitCities by temperature in descending order
        shitCities.sort((a,b) => b.weather.temp - a.weather.temp);

        // sort notshitcities by temp in descending order

        notShitCities.sort((a,b) => b.weather.temp - a.weather.temp);

        // populate shit cities

        shitCities.forEach(city => {
            const cityDiv = document.createElement("div");
            cityDiv.className = "bg-orange-200 shadow-md rounded-lg p-4 mb-4 border-2 border-orange-200"; // Add this line
            cityDiv.innerHTML = `
                <h4 class="font-bold text-lg mb-2">${city.name}</h4>
                <div class="flex items-center mb-2">
                    <span class="text-2xl font-bold">${city.weather.temp}°C</span>
                    <img src="https://openweathermap.org/img/wn/${city.weather.icon}@2x.png" 
                         alt="${city.weather.description}"
                         class="w-16 h-16">
                </div>
                <p class="text-gray-600">${city.weather.description}</p>
            `;
            shitColumn.appendChild(cityDiv);
        });

        notShitCities.forEach(city => {
            const cityDiv = document.createElement("div");
            cityDiv.className = "bg-orange-200 shadow-md rounded-lg p-4 mb-4 border-2 border-orange-200"; // Add this line
            cityDiv.innerHTML = `
                <h4 class="font-bold text-lg mb-2">${city.name}</h4>
                <div class="flex items-center mb-2">
                    <span class="text-2xl font-bold">${city.weather.temp}°C</span>
                    <img src="https://openweathermap.org/img/wn/${city.weather.icon}@2x.png" 
                         alt="${city.weather.description}"
                         class="w-16 h-16">
                </div>
                <p class="text-gray-600">${city.weather.description}</p>
            `;
            notShitColumn.appendChild(cityDiv);
        });

        // add columns to results

        categoriesContainer.appendChild(shitColumn);
        categoriesContainer.appendChild(notShitColumn);

        resultsDiv.appendChild(categoriesContainer);

    

        
    }
 
})