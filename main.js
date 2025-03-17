//Initial setting
document.getElementById("current-date").innerHTML =
  "Date: " + getCurrentFormattedDate();
let iataData = [];
// Inspect if search field is empty or not
let searchfield = false;

//Fetch data from the server at first
fetchFlights(false);

// Fetch IATA data
fetch("iata.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    iataData = data;
  })
  .catch((error) => console.error("Error fetching IATA data:", error));

// Toggle button text underline control
const flightSwitch = document.getElementById("flight-switch");
const departureToggle = document.getElementById("Departure-toggle");
const arrivalToggle = document.getElementById("Arrival-toggle");

flightSwitch.addEventListener("change", function () {
  const isArrival = this.checked;
  arrivalToggle.style.textDecoration = isArrival ? "underline" : "none";
  departureToggle.style.textDecoration = isArrival ? "none" : "underline";
  document.getElementById("search-input").value = "";
  document.getElementById(
    "search-text-display"
  ).innerHTML = `(Next Ten flights)`;

  // Fetch flights based on toggle state
  fetchFlights(isArrival);
});

// change the day-display in the page
function getCurrentFormattedDate() {
  const date = new Date();

  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function getCurrentDateISO() {
  const date = new Date();

  // Get year, month, and day with leading zeros if needed
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Function to get airport information from iata.json
function getAirportInfo(iataCode) {
  return iataData.find((airport) => airport.iata_code === iataCode);
}

// Fetch data from the server
function fetchFlights(isArrival, targeted_iataData, searchfield) {
  const isodate = getCurrentDateISO();
  const arrivalParam = isArrival ? "true" : "false";
  const url = `flight.php?date=${isodate}&lang=en&cargo=false&arrival=${arrivalParam}`;

  //Debug
  console.log("URL: ", url);

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // flight data list (may hv list of flights of previous days)
      flightData = data;

      console.log("Flight Data: ", flightData);
      if (searchfield == true) {
        displayFlights(flightData, targeted_iataData, searchfield);
      } else {
        displayFlights(flightData);
      }
    })
    .catch((error) => {
      console.error("Error fetching flight data:", error);
    });
}

// Function to display flight details
function displayFlights(data, targeted_iataData, searchfield) {
  //dispaly 10 flight details in default
  var count = 0;
  var arrival = data[0].arrival;

  // Get current timeString
  const currentDateTime = new Date();
  const options = { hour: "2-digit", minute: "2-digit", hour12: false };
  const current_timeString = currentDateTime.toLocaleTimeString(
    "en-US",
    options
  );
  console.log("Current Date and Time: ", current_timeString.toString());

  // Check if the flight is arrival or departure
  console.log("Arrival boolean in displayFlights: ", arrival);

  const flightContainer = document.getElementById("flight-detail");
  flightContainer.innerHTML = "";

  flight_type = document.getElementById("flight-type");

  if (arrival) {
    flight_type.innerHTML = "Arrival Information";

    // data list length may > 1 cuz it may hv list of flights of previous days
    for (let i = 0; i < data.length; i++) {
      // loop through the list of flights of each day
      for (let j = 0; j < data[i].list.length; j++) {
        Scheduled_Time =
          data[i].date != getCurrentDateISO()
            ? data[i].date.concat(" ", data[i].list[j].time)
            : data[i].list[j].time;

        Parking_Stand = data[i].list[j].stand;
        Hall = data[i].list[j].hall;
        Belt = data[i].list[j].baggage;
        Status = data[i].list[j].status;
        Flight_No = [];
        Origin_Airport_IATAcode = data[i].list[j].origin[0];

        Airpot = getAirportInfo(Origin_Airport_IATAcode);

        // If search field is true and targeted_iataData is defined
        if (searchfield && targeted_iataData) {
          // Check if the current airport's IATA code is in the targeted_iataData
          const isMatch = targeted_iataData.some(
            (airport) => airport.iata_code === Airpot.iata_code
          );
          if (!isMatch) {
            continue; // Skip this iteration if the airport code is not in the targeted list
          }
        } else {
          // Check if scheduled time is in the future
          if (
            Scheduled_Time <= current_timeString ||
            Scheduled_Time.length > 6
          ) {
            continue; // Skip this iteration if the flight is not in the future
          }
          count++;
        }

        if (count > 10) {
          break;
        }

        //loop through the flights of each time frame
        for (let k = 0; k < data[i].list[j].flight.length; k++) {
          Flight_No.push(data[i].list[j].flight[k].no);
        }
        const Flight_No_String = Flight_No.join("&nbsp;&nbsp;");

        flightContainer.innerHTML += `
        <span class="flights" onclick="toggleFlightDetails(this)">
          <p><strong>Origin (Airpot): </strong></p>
          <p>${Airpot.municipality} (${Airpot.name})</p>
          <p><strong>Flight No: </strong>${Flight_No_String}</p>
          <p><strong>Scheduled Time: </strong>${Scheduled_Time}</p>
          <p class="mobile-view-display hidden">
              <strong>Parking Stand: </strong>${Parking_Stand}&nbsp;
              <strong> Hall: </strong>${Hall}&nbsp;
              <strong> Belt: </strong>${Belt}&nbsp;
            </p>
          <p class="mobile-view-display hidden"><strong>Status: </strong>${Status}</p>
        </span>
          `;
      }
    }
  } else {
    flight_type.innerHTML = "Departure Information";

    // data list length may > 1 cuz it may hv list of flights of previous days
    for (let i = 0; i < data.length; i++) {
      // loop through the list of flights of each day
      for (let j = 0; j < data[i].list.length; j++) {
        Scheduled_Time =
          data[i].date != getCurrentDateISO()
            ? data[i].date.concat(" ", data[i].list[j].time)
            : data[i].list[j].time;
        Terminal = data[i].list[j].terminal;
        Aisle = data[i].list[j].aisle;
        Gate = data[i].list[j].gate;
        Status = data[i].list[j].status;
        Flight_No = [];
        Origin_Airport_IATAcode = data[i].list[j].destination[0];

        Airpot = getAirportInfo(Origin_Airport_IATAcode);

        // If search field is true and targeted_iataData is defined
        if (searchfield && targeted_iataData) {
          // Check if the current airport's IATA code is in the targeted_iataData
          const isMatch = targeted_iataData.some(
            (airport) => airport.iata_code === Airpot.iata_code
          );
          if (!isMatch) {
            continue; // Skip this iteration if the airport code is not in the targeted list
          }
        } else {
          // Check if scheduled time is in the future
          if (
            Scheduled_Time <= current_timeString ||
            Scheduled_Time.length > 6
          ) {
            continue; // Skip this iteration if the flight is not in the future
          }
          count++;
        }

        if (count > 10) {
          break;
        }

        //loop through the flights of each time frame
        for (let k = 0; k < data[i].list[j].flight.length; k++) {
          Flight_No.push(data[i].list[j].flight[k].no);
        }
        const Flight_No_String = Flight_No.join("&nbsp;&nbsp;");

        flightContainer.innerHTML += `
        <span class="flights" onclick="toggleFlightDetails(this)">
          <p><strong>Destination (Airpot): </strong></p>
          <p>${Airpot.municipality} (${Airpot.name})</p>
          <p><strong>Flight No: </strong>${Flight_No_String}</p>
          <p><strong>Scheduled Time: </strong>${Scheduled_Time}</p>
          <p class="mobile-view-display hidden">
              <strong>Terminal: </strong>${Terminal}&nbsp;
              <strong>Aisle: </strong>${Aisle}&nbsp;
              <strong>Gate: </strong>${Gate}&nbsp;
          </p>
          <p class="mobile-view-display hidden"><strong>Status: </strong>${Status}</p>
        </span>
          `;
      }
    }
  }
}

// Reload button setting
// Add event listener for the reload button
document.getElementById("reload-button").addEventListener("click", reloadPage);
// Function to reload the page and reset to original settings
function reloadPage() {
  location.reload(); // This will refresh the page
}

// Search functionality
document.getElementById("search-button").addEventListener("click", function () {
  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase();

  // change searchfield to true
  searchfield = true;

  // search-text-display
  document.getElementById(
    "search-text-display"
  ).innerHTML = `(Search: ${searchTerm})`;

  //debug
  console.log(searchTerm);

  const isArrival = flightSwitch.checked; // Check if arrival or departure
  const targeted_iataData = searchFlights(searchTerm);

  // Update display with search results
  fetchFlights(isArrival, targeted_iataData, searchfield);
});

// Function to get correct Iata code in search field
function searchFlights(searchTerm) {
  return iataData.filter(
    (airport) =>
      airport.iata_code.toLowerCase() === searchTerm.toLowerCase() ||
      airport.municipality.toLowerCase() === searchTerm.toLowerCase() ||
      airport.name.toLowerCase() === searchTerm.toLowerCase()
  );
}

// Reset functionality
document.getElementById("reset-button").addEventListener("click", function () {
  document.getElementById("search-input").value = ""; // Clear input field
  fetchFlights(flightSwitch.checked); // Reload original flights based on current toggle state
  document.getElementById(
    "search-text-display"
  ).innerHTML = `(Next Ten flights)`;
});

// Function to toggle visibility of first two rows
function toggleFlightDetails(flightBox) {
  const mobileViewDisplays = flightBox.querySelectorAll(".mobile-view-display");
  const firstRow = mobileViewDisplays[0]; // First child
  const secondRow = mobileViewDisplays[1]; // Second child

  // Toggle visibility
  firstRow.classList.toggle("hidden");
  secondRow.classList.toggle("hidden");
}

// Add event listeners to each flight box (if not inline)
document.querySelectorAll(".flights").forEach((flightBox) => {
  flightBox.addEventListener("click", () => toggleFlightDetails(flightBox));
});
