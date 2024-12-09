const OpenCageAPIKey = process.env.OPEN_CAGE_KEY

async function getCityCoordinates(city) {
  const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${city}&key=${OpenCageAPIKey}`);
  const data = await response.json();
  if (data.results.length > 0) {
    const { lat, lng } = data.results[0].geometry;
    return { lat, lng };
  } else {
    throw new Error('City not found');
  }
}

function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }),
      error => reject(error)
    );
  });
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRadians = deg => deg * (Math.PI / 180);
  const toDegrees = rad => rad * (180 / Math.PI);

  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
            Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360; // Normalize to 0-360
}

function drawCompass(bearing) {
  const canvas = document.getElementById('compass');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 150;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw compass circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw compass needle
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((bearing * Math.PI) / 180); // Convert bearing to radians

  ctx.beginPath();
  ctx.moveTo(0, -radius + 20); // Needle tip
  ctx.lineTo(-10, 10);         // Left base
  ctx.lineTo(10, 10);          // Right base
  ctx.closePath();
  ctx.fillStyle = 'red';
  ctx.fill();

  ctx.restore();
}

document.getElementById('city-form').addEventListener('submit', async event => {
  event.preventDefault();
  const city = document.getElementById('city-input').value;

  try {
    const userLocation = await getUserLocation();
    const cityCoordinates = await getCityCoordinates(city);
    const bearing = calculateBearing(
      userLocation.lat, userLocation.lng,
      cityCoordinates.lat, cityCoordinates.lng
    );

    drawCompass(bearing);
  } catch (error) {
    alert(error.message);
  }
});
