// netlify/functions/g.js
// Redirection 302 vers Booking. Le code client appelle /.netlify/functions/g?u=<base64>
// et la fonction renvoie un 302 vers l'URL decodee. Le Referer cote Booking sera oneroadtrip.com,
// pas la page itineraire avec son JS visible.

exports.handler = async function(event) {
  var fallback = "https://www.oneroadtrip.com/";
  try {
    var u = (event.queryStringParameters || {}).u || "";
    if (!u) return { statusCode: 302, headers: { Location: fallback, "Cache-Control": "no-store" } };

    // Decodage base64 (URL-safe)
    var url = "";
    try {
      url = Buffer.from(u, "base64").toString("utf8");
    } catch (e) {
      return { statusCode: 302, headers: { Location: fallback, "Cache-Control": "no-store" } };
    }

    // Securite : on accepte UNIQUEMENT les URL pointant vers booking.com
    // (sinon n'importe qui pourrait utiliser la fonction comme open-redirect)
    if (!/^https:\/\/www\.booking\.com\/hotel\//i.test(url)) {
      return { statusCode: 302, headers: { Location: fallback, "Cache-Control": "no-store" } };
    }

    return {
      statusCode: 302,
      headers: {
        Location: url,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer-when-downgrade"
      }
    };
  } catch (e) {
    return { statusCode: 302, headers: { Location: fallback, "Cache-Control": "no-store" } };
  }
};
