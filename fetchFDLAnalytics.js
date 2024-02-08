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
    for (const dynamicLink of links) {
      const linkId = dynamicLink.split("/").pop();
      const encodedDynamicLink = encodeURIComponent(dynamicLink);

      // Construct the API URL
      const apiUrl = `https://firebasedynamiclinks.googleapis.com/v1/${encodedDynamicLink}/linkStats?durationDays=${durationDays}`;

      // Make the API request
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${jwtClient.credentials.access_token}`,
        },
      });

      // Create a new document for this 7-day range with the firstDay and lastDay as the document ID
      // const docRef = db
      //   .collection("dynamicLinkStats")
      //   .doc()
      //   .collection("dateRanges")
      //   .doc(dateRangeId);
      // await docRef.set({
      //   data: response.data,
      // });

      const linkDocRef = db.collection("dynamicLinkStats").doc(linkId);
      await linkDocRef.collection("dateRanges").doc(dateRangeId).set({
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
const links = [
  "https://hablalo.page.link/PruebaPortho",
  "https://hablalo.page.link/LaEspumeria",
  "https://hablalo.page.link/Flybondi",
];
const durationDays = "30"; // Example: Fetch stats for the last 7 days
fetchDynamicLinkStats(links, durationDays);
