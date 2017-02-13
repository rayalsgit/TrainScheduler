/* global firebase moment */
// Steps to complete:

// 1. Initialize Firebase
// 2. Create button for adding new employees - then update the html + update the database
// 3. Create a way to retrieve employees from the employee database.
// 4. Create a way to calculate the months worked. Using difference between start and current time.
//    Then use moment.js formatting to set difference in months.
// 5. Calculate Total billed



// Initialize Firebase
var config = {
    apiKey: "AIzaSyD_lHm39Rj-aH5mOk_daFmy0bmRJvpqowI",
    authDomain: "trainscheduler-1329c.firebaseapp.com",
    databaseURL: "https://trainscheduler-1329c.firebaseio.com",
    storageBucket: "trainscheduler-1329c.appspot.com",
    messagingSenderId: "844334903278"
};
firebase.initializeApp(config);


var database = firebase.database();

// 2. Button for adding trains
$("#add-train-btn").on("click", function(event) {
    event.preventDefault();
    var key = "";
    if ($(this).html() === "Update") {
        $(this).html("Submit");
        key = $(this).attr("data-tr");
        $(this).attr("data-tr", "");
    }

    // Grabs user input
    var trainName = $("#train-name-input").val().trim();
    var dest = $("#destination-input").val().trim();
    var frequency = parseInt($("#frequency-input").val().trim());
    var fttime = $("#fttime-input").val().trim();

    // Creates local "temporary" object for holding train data
    var train = {
        name: trainName,
        dest: dest,
        frequency: frequency,
        fttime: fttime
    };

    if (key.length === 0) {
        // Uploads new train data to the database
        database.ref().push(train);
    } else {
        // update existing train using its Firebase key
        var updates = {};
        updates[key] = train;
        database.ref().update(updates);
    }


    // Clears all of the text-boxes
    $("#train-name-input").val("");
    $("#destination-input").val("");
    $("#frequency-input").val("");
    $("#fttime-input").val("");

    // Prevents moving to new page
    return false;
});

// 3. Create Firebase event for adding a row in the html when a user adds an entry
database.ref().on("child_added", function(record, prevChildKey) {

    console.log(record.val());
    var trainid = record.key;

    // Store everything into a variable.
    var trainName = record.val().name;
    var dest = record.val().dest;
    var frequency = record.val().frequency;
    var st = record.val().fttime;
    var fttime = moment(st, "HH:mm");

    var endTime = moment();

    var mins = endTime.diff(fttime, "minutes");
    console.log("Diff in mins: " + mins);

    var minSinceLast = mins % frequency;
    var minsRemaining = frequency - minSinceLast;
    var nextArrival = moment().add(minsRemaining, "minutes").format("HH:mm");
    console.log("Next Arrival In: " + minsRemaining + " mins");
    console.log(nextArrival);

    // Add each train's data into the table
    $("#train-table > tbody").append("<tr class='train_tr' data-st='" + st + "' data-id='" + trainid + "'><td>" + trainName + "</td><td>" + dest + "</td><td class='fr'>" +
        frequency + "</td><td class='na'>" + nextArrival + "</td><td class='mr'>" + minsRemaining + "</td><td><button class='btn btn-warning upd' type='button' onClick='handleUpdate()'>Edit</button></td><td><button class='btn btn-danger del' type='button' onClick='handleDelete()'>Delete</button></td></tr>");
});

database.ref().on("child_removed", function(record) {
    var trainid = record.key;
    $(".train_tr").filter(function() {
        return $(this).attr('data-id') === trainid;
    }).remove();
});

database.ref().on("child_changed", function(record) {
    var trainid = record.key;
    var trainName = record.val().name;
    var dest = record.val().dest;
    var frequency = record.val().frequency;
    var st = record.val().fttime;
    var fttime = moment(st, "HH:mm");

    var endTime = moment();

    var mins = endTime.diff(fttime, "minutes");

    var minSinceLast = mins % frequency;
    var minsRemaining = frequency - minSinceLast;
    var nextArrival = moment().add(minsRemaining, "minutes").format("HH:mm");
    var content = "<td>" + trainName + "</td><td>" + dest + "</td><td class='fr'>" +
        frequency + "</td><td class='na'>" + nextArrival + "</td><td class='mr'>" + minsRemaining + "</td><td><button class='btn btn-warning upd' type='button' onClick='handleUpdate()'>Edit</button></td><td><button class='btn btn-danger del' type='button' onClick='handleDelete()'>Delete</button></td>";
    $(".train_tr").filter(function() {
        return $(this).attr('data-id') === trainid;
    }).html(content);
});

var timer = setInterval(function() {

    var rows = document.getElementsByClassName("train_tr");
    for (var i = 0; i < rows.length; i++) {
        var tr = rows[i];
        var st = tr.getAttribute("data-st");
        var fttime = moment(st, "HH:mm");
        var e = tr.children[2];
        var frequency = parseInt(e.innerText);
        var endTime = moment();

        var mins = endTime.diff(fttime, "minutes");
        console.log("Diff in mins: " + mins);

        var minSinceLast = mins % frequency;
        var minsRemaining = frequency - minSinceLast;
        var nextArrival = moment().add(minsRemaining, "minutes").format("HH:mm");

        tr.children[3].innerText = nextArrival;
        tr.children[4].innerText = minsRemaining;
    }

}, 60000);


function handleDelete() {
    event.preventDefault();

    var newPostKey = event.target.parentNode.parentNode.getAttribute("data-id");

    var updates = {};
    updates[newPostKey] = null;

    return database.ref().update(updates);
};

function handleUpdate() {
    event.preventDefault();
    var newPostKey = event.target.parentNode.parentNode.getAttribute("data-id");
    var ref = firebase.database().ref(newPostKey);
    ref.once("value")
        .then(function(snapshot) {
            var trainName = snapshot.val().name;
            var dest = snapshot.val().dest;
            var frequency = snapshot.val().frequency;
            var st = snapshot.val().fttime;

            $("#train-name-input").val(trainName);
            $("#destination-input").val(dest);
            $("#frequency-input").val(frequency);
            $("#fttime-input").val(st);

            $("#add-train-btn").html("Update");
            $("#add-train-btn").attr("data-tr", snapshot.key);

        });
}