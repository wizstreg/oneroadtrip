exports.handler = async function() {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({
      ORT_FB_APIKEY:     process.env.ORT_FB_APIKEY || '',
      ORT_FB_AUTHDOMAIN: process.env.ORT_FB_AUTHDOMAIN || '',
      ORT_FB_PROJECTID:  process.env.ORT_FB_PROJECTID || '',
      ORT_FB_APPID:      process.env.ORT_FB_APPID || ''
     })
  };
};
