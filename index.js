let sampleData = {
    "hours": ["6am", "9am", "12pm", "3pm", "6pm", "9pm", "12am"],
    "temperature": [21, 22, 24, 25, 29, 28, 26]
};


let temperatureChart;
let ctx;

document.addEventListener("DOMContentLoaded", function () {
    ctx = document.getElementById('temperatureGraph').getContext('2d');

    let temperatureData = {
        labels: sampleData.hours,
        datasets: [{
            data: sampleData.temperature,
            borderColor: '#00aaff',
            borderWidth: 2,
            fill: false,
            pointBackgroundColor: '#00aaff',
            pointRadius: 5
        }]
    };

    let temperatureOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    };

    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: temperatureData,
        options: temperatureOptions
    });
});


// Function to fetch current weather data
async function fetchWeather(city) {
    const apiKey = 'ce5b8af98f568a5d4be6e77035ba29f3';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}

// Function to fetch 5-day forecast
async function fetchForecast(lat, lon) {
    const apiKey = 'ce5b8af98f568a5d4be6e77035ba29f3';
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch forecast data: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}

// Function to fetch sunrise and sunset times
async function fetchSunTimes(lat, lon) {
    const apiKey = 'ce5b8af98f568a5d4be6e77035ba29f3';
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch sun times: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}

async function updateUI(city) {
    try {
        const weatherData = await fetchWeather(city);
        const forecastData = await fetchForecast(weatherData.coord.lat, weatherData.coord.lon);

        document.querySelector('.location').textContent = `${weatherData.name},${weatherData.sys.country}`;
        document.querySelector('.current-temperature').innerHTML = `${weatherData.main.temp}°C <i class="fas fa-sun"></i>`;
        document.querySelector('.details .detail-item:first-child').innerHTML = `Pressure<label><br/>${weatherData.main.pressure} hpa</label>`;
        document.querySelector('.details .detail-item:last-child').innerHTML = `Humidity<label><br/>${weatherData.main.humidity}%</label>`;

        // Update sunrise and sunset times
        const sunrise = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString();
        const sunset = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString();
        document.querySelector('.sun-details .sunrise').innerHTML = `<i class="fas fa-arrow-up"></i>Sunrise<label>&nbsp;${sunrise}</label>`;
        document.querySelector('.sun-details .sunset').innerHTML = `<i class="fas fa-arrow-down"></i>Sunset<label>&nbsp; ${sunset}</label>`;

        // Update 5-day forecast
        const forecastDiv = document.querySelector('.forecast');
        forecastDiv.innerHTML = '';  // Clear existing forecast data
        for (let i = 0; i < forecastData.list.length; i += 8) {  // Loop through every 8th entry to get daily data
            const dayData = forecastData.list[i];
            const day = new Date(dayData.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
            const maxTemp = dayData.main.temp_max;
            const minTemp = dayData.main.temp_min;
            const weatherIconClass = getWeatherIconClass(dayData.weather[0].icon);
            const dayDiv = `
                <div class="day">
                    ${day}
                    <i class="${weatherIconClass}"></i>
                    ${maxTemp}° ${minTemp}°
                </div>`;
            forecastDiv.innerHTML += dayDiv;
        }
        updateSampleData(forecastData);
    } catch (error) {
        console.error(error.message);
    }
}

function updateSampleData(forecastData) {
    sampleData.hours = [];
    sampleData.temperature = [];

    // Get data for the next day (first 8 entries in the forecastData.list array)
    for (let i = 0; i < 8; i++) {
        const entry = forecastData.list[i];
        const time = new Date(entry.dt * 1000).toLocaleTimeString([], { hour: '2-digit' });
        sampleData.hours.push(time);
        sampleData.temperature.push(entry.main.temp);
    }

    // Update the chart
    updateChart();
}

// Helper function to map OpenWeatherMap icon codes to FontAwesome icon classes
function getWeatherIconClass(iconCode) {
    switch (iconCode) {
        case '01d': return 'fas fa-sun';
        case '01n': return 'fas fa-moon';
        case '02d': case '02n': return 'fas fa-cloud-sun';
        case '03d': case '03n': case '04d': case '04n': return 'fas fa-cloud';
        case '09d': case '09n': case '10d': case '10n': return 'fas fa-cloud-rain';
        case '11d': case '11n': return 'fas fa-bolt';
        case '13d': case '13n': return 'fas fa-snowflake';
        case '50d': case '50n': return 'fas fa-smog';
        default: return 'fas fa-cloud';
    }
}

// Event listener for search bar
document.querySelector('.search-bar input').addEventListener('keyup', async (event) => {
    if (event.key === 'Enter') {
        const city = event.target.value;
        updateUI(city);
    }
});

function updateChart() {
    if (temperatureChart) {  // Destroy the old chart instance if exists
        temperatureChart.destroy();
    }

    // Create a new chart instance with updated data
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sampleData.hours,
            datasets: [{
                data: sampleData.temperature,
                borderColor: '#00aaff',
                borderWidth: 2,
                fill: false,
                pointBackgroundColor: '#00aaff',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}