const axios = require("axios");
const { google } = require("googleapis");
const admin = require("firebase-admin");

//data from JSON file
const serviceAccount = require("./service-account.json");
const { client_email, private_key } = serviceAccount;

//initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hablalo-app.firebaseio.com",
});

// Firestore database reference
const db = admin.firestore();

// Authenticate a JWT client with the service account.
const jwtClient = new google.auth.JWT(client_email, null, private_key, [
  "https://www.googleapis.com/auth/firebase",
]);

async function fetchDynamicLinkStats(links, durationDays) {
  try {
    // Ensure the JWT client is authorized
    await jwtClient.authorize();

    const date = new Date().toISOString().slice(0, 10);

    const currentDate = new Date();

    currentDate.setDate(currentDate.getDate() - 1); // Adjust to "yesterday"
    const lastDay = `${currentDate.getDate().toString().padStart(2, "0")}-${(
      currentDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${currentDate.getFullYear()}`;

    currentDate.setDate(currentDate.getDate() - (durationDays - 1));
    const firstDay = `${currentDate.getDate().toString().padStart(2, "0")}-${(
      currentDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${currentDate.getFullYear()}`;
    const dateRangeId = `${firstDay}_to_${lastDay}`;

    //iterate over the links
    for (const [linkName, dynamicLink] of Object.entries(links)) {
      const encodedDynamicLink = encodeURIComponent(dynamicLink);

      // Construct the API URL
      const apiUrl = `https://firebasedynamiclinks.googleapis.com/v1/${encodedDynamicLink}/linkStats?durationDays=${durationDays}`;

      // Make the API request
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${jwtClient.credentials.access_token}`,
        },
      });

      const linkDocRef = db.collection("dynamicLinkStats").doc(linkName);
      await linkDocRef.collection("dateRanges").doc(date).set({
        data: response.data, // Data for the new date range
      });

      console.log(
        `Data for ${dynamicLink} stored successfully in document ${dateRangeId}.`
      );
      console.log("Response data:", response.data);
    }
  } catch (error) {
    console.error(
      "Error fetching Dynamic Link statistics:",
      error.response ? error.response.data : error.message
    );
  }
}

// Example usage
const links = {
  "Portho-Prueba": "https://hablalo.page.link/PruebaPortho",
  Santander: "https://hablalo.page.link/SantanderPrd",
  "Santander-M": "https://hablalo.page.link/SantanderMX",
  Flybondi: "https://hablalo.page.link/Flybondi",
  "LA-ESPUMERÍA": "https://hablalo.page.link/LaEspumeria",
  Diggit: "https://hablalo.page.link/diggit",
  Samsung: "https://hablalo.page.link/Samsung",
  "Hiper-ChangoMâs": "https://hablalo.page.link/Hiperchangomas",
  Marriot: "https://hablalo.page.link/Marriot",
  "BURGER-KING": "https://hablalo.page.link/BurgerKing",
  "BK-CHILE": "https://hablalo.page.link/BurgerKingCL",
  Nespresso: "https://hablalo.page.link/Nespresso",
  Electrolux: "https://hablalo.page.link/Electrolux",
  "Club-Atlético River Plate": "https://hablalo.page.link/RiverPrd",
  MegatoneQR1: "https://hablalo.page.link/MegatoneQR1",
  MegatoneQR2: "https://hablalo.page.link/MegatoneQR2",
};

const durationDays = "7"; // Example: Fetch stats for the last 7 days
fetchDynamicLinkStats(links, durationDays);
