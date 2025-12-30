// Netlify Function : Proxy pour API Hotelsbed
// Fichier : netlify/functions/hotels-search.js

const crypto = require('crypto');

const HOTELSBED_CONFIG = {
  apiKey: '67167daf09899646a6f16d5d6e6c6bfb',
  secret: '93a4ae2b71',
  baseUrl: 'https://api.test.hotelbeds.com/hotel-api/1.0'
};

function generateSignature() {
  const timestamp = Math.floor(Date.now() / 1000);
  const toHash = HOTELSBED_CONFIG.apiKey + HOTELSBED_CONFIG.secret + timestamp;
  return crypto.createHash('sha256').update(toHash).digest('hex');
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const params = JSON.parse(event.body);
    const { lat, lon, checkIn, checkOut, radius = 15, maxResults = 3 } = params;

    if (!lat || !lon || !checkIn || !checkOut) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters: lat, lon, checkIn, checkOut' })
      };
    }

    const signature = generateSignature();

    const requestBody = {
      stay: {
        checkIn: checkIn,
        checkOut: checkOut
      },
      occupancies: [{
        rooms: 1,
        adults: 2,
        children: 0
      }],
      geolocation: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        radius: radius,
        unit: 'km'
      },
      filter: {
        maxHotels: maxResults * 2
      }
    };

    console.log('[HOTELS-PROXY] Requesting:', { lat, lon, checkIn, checkOut });

    const response = await fetch(`${HOTELSBED_CONFIG.baseUrl}/hotels`, {
      method: 'POST',
      headers: {
        'Api-key': HOTELSBED_CONFIG.apiKey,
        'X-Signature': signature,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HOTELS-PROXY] API Error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Hotelsbed API error: ${response.status}`,
          details: errorText
        })
      };
    }

    const data = await response.json();

    // Parser et simplifier les résultats
    const hotels = [];
    if (data.hotels && data.hotels.hotels) {
      for (const hotel of data.hotels.hotels.slice(0, maxResults)) {
        let minPrice = Infinity;
        let currency = 'EUR';

        if (hotel.rooms) {
          for (const room of hotel.rooms) {
            if (room.rates) {
              for (const rate of room.rates) {
                const price = parseFloat(rate.net);
                if (price < minPrice) {
                  minPrice = price;
                  currency = rate.currency || 'EUR';
                }
              }
            }
          }
        }

        hotels.push({
          code: hotel.code,
          name: hotel.name,
          category: hotel.categoryName || `${hotel.category}*`,
          stars: parseInt(hotel.category) || 3,
          price: minPrice !== Infinity ? minPrice : null,
          currency: currency,
          latitude: hotel.latitude,
          longitude: hotel.longitude
        });
      }
    }

    // Trier par prix
    hotels.sort((a, b) => (a.price || 9999) - (b.price || 9999));

    console.log('[HOTELS-PROXY] Found:', hotels.length, 'hotels');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ hotels })
    };

  } catch (error) {
    console.error('[HOTELS-PROXY] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
