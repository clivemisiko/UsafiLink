# Google Maps Integration Setup Guide

## 🗺️ Overview
The Driver Dashboard now includes Google Maps integration for real-time navigation, similar to Uber. Drivers can:
- See their current location
- View the customer's destination
- Get turn-by-turn directions
- See distance and ETA
- Open the route in Google Maps app

## 📋 Setup Instructions

### Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Directions API**
   - **Geolocation API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### Step 2: Restrict Your API Key (Recommended)

For security, restrict your API key:
1. Click on your API key in the Credentials page
2. Under **Application restrictions**, select **HTTP referrers**
3. Add: `http://localhost:5173/*` (for development)
4. For production, add your domain: `https://yourdomain.com/*`
5. Under **API restrictions**, select **Restrict key**
6. Choose:
   - Maps JavaScript API
   - Directions API
   - Geolocation API

### Step 3: Add API Key to Project

Create a file `.env.local` in the `frontend` directory:

```bash
# frontend/.env.local
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Important:** 
- The `.env.local` file is gitignored and won't be committed
- Never commit your API key to version control
- Use environment variables in production

### Step 4: Restart Development Server

After adding the API key:
```bash
# Stop the server (Ctrl + C)
# Restart it
npm run dev
```

## 🎯 Features

### For Drivers:
- **Real-time Location**: Automatically detects driver's current GPS position
- **Route Display**: Blue line showing the optimal route to customer
- **Distance & ETA**: Calculated automatically based on traffic
- **Custom Markers**: 
  - Blue marker = Driver location ("You")
  - Red marker = Customer destination
- **Quick Actions**:
  - "Open in Google Maps" button for native navigation
  - Direct link to Google Maps with pre-filled directions

### Fallback Mode (No API Key):
If no API key is provided, the map shows:
- Instructions to get an API key
- Static location information
- "Open in Google Maps" button still works

## 🔧 Customization

### Change Default Location
Edit `frontend/src/components/RouteMap.jsx`:
```javascript
// Line 12-13: Default driver location
const [driverLocation, setDriverLocation] = useState({ 
  lat: -1.2864, // Your latitude
  lng: 36.8172  // Your longitude
});
```

### Adjust Map Styling
In `RouteMap.jsx`, modify the map options:
```javascript
options={{
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true, // Change to true to show map types
  fullscreenControl: true,
  styles: [] // Add custom map styles here
}}
```

### Change Route Color
```javascript
polylineOptions: {
  strokeColor: '#3b82f6', // Blue (change to any color)
  strokeWeight: 5,
  strokeOpacity: 0.8
}
```

## 📊 API Usage & Costs

Google Maps offers a generous free tier:
- **$200 free credit per month**
- Maps JavaScript API: $7 per 1,000 loads
- Directions API: $5 per 1,000 requests

For a small-medium operation:
- ~100 drivers using maps daily
- ~10 directions requests per driver
- Monthly cost: ~$35 (after free tier)

## 🚀 Testing

1. Login as a driver: `driver` / `driver123`
2. You should see the map in the "Current Job" section
3. Allow browser location permissions when prompted
4. The map will show:
   - Your location (or default if denied)
   - Route to customer in Kilimani
   - Distance and ETA

## 🔍 Troubleshooting

### "Google Maps API Key Required" Message
- Check `.env.local` file exists in `frontend/` directory
- Verify the key starts with `VITE_GOOGLE_MAPS_API_KEY=`
- Restart the dev server after adding the key

### Map Not Loading
- Check browser console for errors
- Verify APIs are enabled in Google Cloud Console
- Check API key restrictions aren't too strict
- Ensure you have internet connection

### Location Not Updating
- Allow location permissions in browser
- Check browser console for geolocation errors
- Try on HTTPS (required for production)

### "This page can't load Google Maps correctly"
- API key is invalid or restricted
- Billing not enabled on Google Cloud account
- Required APIs not enabled

## 📱 Production Deployment

Before deploying:
1. Set up environment variable in your hosting platform
2. Update API key restrictions to include production domain
3. Enable billing on Google Cloud (required even with free tier)
4. Consider rate limiting to prevent abuse
5. Monitor API usage in Google Cloud Console

## 🆘 Support Links

- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Directions API Docs](https://developers.google.com/maps/documentation/directions)
- [React Google Maps API](https://react-google-maps-api-docs.netlify.app/)
