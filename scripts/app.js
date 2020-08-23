(function() {
  "use strict";



  var app = {
    isLoading: true,
    visibleCards: {},
    selectedTimetables: [],
    spinner: document.querySelector(".loader"),
    cardTemplate: document.querySelector(".cardTemplate"),
    container: document.querySelector(".main"),
    addDialog: document.querySelector(".dialog-container")
  };

  let db;
  let dbReq = indexedDB.open("myDatabase", 1);
  dbReq.onupgradeneeded = function(event) {
    // Set the db variable to our database so we can use it!
    db = event.target.result;

    // Create an object store named notes. Object stores
    // in databases are where data are stored.
    let notes = db.createObjectStore("notes", { autoIncrement: true });
  };
  dbReq.onsuccess = function(event) {
    db = event.target.result;
  };
  dbReq.onerror = function(event) {
    alert("error opening database " + event.target.errorCode);
  };

  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  document.getElementById("butRefresh").addEventListener("click", function() {
    // Refresh all of the metro stations
    app.updateSchedules();
  });

  document.getElementById("butAdd").addEventListener("click", function() {
    // Open/show the add new station dialog
    app.toggleAddDialog(true);
  });

  document.getElementById("butAddCity").addEventListener("click", function() {
    var select = document.getElementById("selectTimetableToAdd");
    var selected = select.options[select.selectedIndex];
    var key = selected.value;
    var label = selected.textContent;
    if (!app.selectedTimetables) {
      app.selectedTimetables = [];
    }
    app.getSchedule(key, label);
    app.selectedTimetables.push({ key: key, label: label });
    addStation(db, key, label);
    app.toggleAddDialog(false);
  });

  document.getElementById("butAddCancel").addEventListener("click", function() {
    // Close the add new station dialog
    app.toggleAddDialog(false);
  });

  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Toggles the visibility of the add new station dialog.
  app.toggleAddDialog = function(visible) {
    if (visible) {
      app.addDialog.classList.add("dialog-container--visible");
    } else {
      app.addDialog.classList.remove("dialog-container--visible");
    }
  };

  // Updates a timestation card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.

  app.updateTimetableCard = function(data) {
    console.log("sdssdsdffff");
    var key = data.key;
    var dataLastUpdated = new Date(data.created);
    var schedules = data.schedules;
    var card = app.visibleCards[key];

    if (!card) {
      var label = data.label.split(", ");
      var title = label[0];
      var subtitle = label[1];
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove("cardTemplate");
      card.querySelector(".label").textContent = title;
      card.querySelector(".subtitle").textContent = subtitle;
      card.removeAttribute("hidden");
      app.container.appendChild(card);
      app.visibleCards[key] = card;
    }
    card.querySelector(".card-last-updated").textContent = data.created;

    var scheduleUIs = card.querySelectorAll(".schedule");
    for (var i = 0; i < 4; i++) {
      var schedule = schedules[i];
      var scheduleUI = scheduleUIs[i];
      if (schedule && scheduleUI) {
        scheduleUI.querySelector(".message").textContent = schedule.message;
      }
    }

    if (app.isLoading) {
      console.log("sdsd");
      app.spinner.setAttribute("hidden", true);
      app.container.removeAttribute("hidden");
      app.isLoading = false;
    }
  };

  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  app.getSchedule = function(key, label) {
    console.log("llave", key);
    var url = "https://api-ratp.pierre-grimaud.fr/v3/schedules/" + key;

    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          var result = {};
          result.key = key;
          result.label = label;
          result.created = response._metadata.date;
          result.schedules = response.result.schedules;
          app.updateTimetableCard(result);

          // Instantiate a JSON object from the request response

          console.log("entro al if bueno");
        }
      } else {
        console.log("entro al if");
        app.updateTimetableCard(initialStationTimetable);
        // Return the initial weather forecast since no data is available.
      }
    };
    request.open("GET", url);
    try {
      console.log("1");
      request.send();
      console.log("2");
    } catch (err) {
      app.updateTimetableCard(initialStationTimetable);
    }
  };

  // Iterate all of the cards and attempt to get the latest timetable data
  app.updateSchedules = function() {
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function(key) {
      console.log("key", key);
      app.getSchedule(key);
    });
  };

  /*
   * Fake timetable data that is presented when the user first uses the app,
   * or when the user has not saved any stations. See startup code for more
   * discussion.
   */

  var initialStationTimetable = {
    key: "metros/1/bastille/A",
    label: "Bastille, Direction La Défense",
    created: "2017-07-18T17:08:42+02:00",
    schedules: [
      {
        message: "0 mn"
      },
      {
        message: "2 mn"
      },
      {
        message: "5 mn"
      }
    ]
  };

  /************************************************************************
   *
   * Code required to start the app
   *
   * NOTE: To simplify this codelab, we've used localStorage.
   *   localStorage is a synchronous API and has serious performance
   *   implications. It should not be used in production applications!
   *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
   *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
   ************************************************************************/

  function addStation(db, key, lable) {
    // Start a database transaction and get the notes object store
    let tx = db.transaction(["notes"], "readwrite");
    let store = tx.objectStore("notes");
    // Put the sticky note into the object store
    let estacion = { text: key, timestamp: lable };
    store.add(estacion);
    // Wait for the database transaction to complete
    tx.oncomplete = function() {
      console.log("stored note!");
    };
    tx.onerror = function(event) {
      alert("error storing note " + event.target.errorCode);
    };
  }

  function getAndDisplayNotes(db) {
    let tx = db.transaction(["notes"], "readwrite");
    let store = tx.objectStore("notes");
    // Create a cursor request to get all items in the store, which
    // we collect in the allNotes array
    let req = store.openCursor();
    let allNotes = [];

    req.onsuccess = function(event) {
      // The result of req.onsuccess is an IDBCursor
      let cursor = event.target.result;
      if (cursor != null) {
        // If the cursor isn't null, we got an IndexedDB item.
        // Add it to the note array and have the cursor continue!
        //allNotes.push(cursor.value);
        app.getSchedule(cursor.value.text, cursor.value.timestamp);
        app.selectedTimetables.push({
          key: cursor.value.text,
          label: cursor.value.timestamp
        });

        console.log("cursor value", cursor.value);
        //app.selectedTimetables.push({ key: cursor.value, label: cursor.value });
        cursor.continue();
      } else {
        // If we have a null cursor, it means we've gotten
        // all the items in the store, so display the notes we got
      }
    };
    req.onerror = function(event) {
      alert("error in cursor request " + event.target.errorCode);
    };
  }

  setTimeout(() => {
    getAndDisplayNotes(db);
  }, 1000);
  app.getSchedule("metros/1/bastille/A", "Bastille, Direction La Défense");
  app.selectedTimetables = [
    { key: initialStationTimetable.key, label: initialStationTimetable.label }
  ];
})();
