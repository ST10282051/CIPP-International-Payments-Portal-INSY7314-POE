import api, { getCards, getProfile } from "./axios"; // adjust path to your axios.js

async function testEndpoints() {
  console.log("Testing Axios requests...");

  // Log the base URL
  console.log("Axios base URL:", api.defaults.baseURL);

  try {
    // Test /api/customers/cards
    console.log("GET /api/customers/cards...");
    const cardsRes = await getCards();
    console.log("Cards response:", cardsRes.data);
  } catch (err) {
    if (err.response) {
      console.error("Cards API error:", err.response.status, err.response.data);
    } else {
      console.error("Cards Network error:", err.message);
    }
  }

  try {
    // Test /api/customers/profile
    console.log("GET /api/customers/profile...");
    const profileRes = await getProfile();
    console.log("Profile response:", profileRes.data);
  } catch (err) {
    if (err.response) {
      console.error("Profile API error:", err.response.status, err.response.data);
    } else {
      console.error("Profile Network error:", err.message);
    }
  }
}

// Optional: log full request URLs via Axios interceptor
api.interceptors.request.use(config => {
  console.log("Axios request:", config.method.toUpperCase(), config.baseURL + config.url);
  return config;
});

testEndpoints();
