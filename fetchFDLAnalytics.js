const axios = require("axios");
const { google } = require("googleapis");

// Load the service account key JSON file.
const serviceAccount = require("./config/serviceAccountKey.json");

// Authenticate a JWT client with the service account.
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ["https://www.googleapis.com/auth/firebase"]
);

async function fetchDynamicLinkStats(dynamicLink, durationDays) {
  try {
    // Ensure the JWT client is authorized
    await jwtClient.authorize();

    console.log(`Using access token: ${jwtClient.credentials.access_token}`);

    // Encode the dynamic link
    const encodedDynamicLink = encodeURIComponent(dynamicLink);

    // Construct the API URL
    const apiUrl = `https://firebasedynamiclinks.googleapis.com/v1/${encodedDynamicLink}/linkStats?durationDays=${durationDays}`;

    axios.interceptors.request.use((request) => {
      console.log("Starting Request", JSON.stringify(request, null, 2)); //para ver el request que se esta haciendo
      return request;
    });

    // Make the API request
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${jwtClient.credentials.access_token}`,
      },
    });

    // Log the response data
    console.log(response.data);
  } catch (error) {
    console.error(
      "Error fetching Dynamic Link statistics:",
      error.response ? error.response.data : error.message
    );
  }
}

// Example usage
const dynamicLink = "https://hablalo.page.link/PruebaPortho"; // Replace with your actual dynamic link
const durationDays = "7"; // Example: Fetch stats for the last 7 days
fetchDynamicLinkStats(dynamicLink, durationDays);
