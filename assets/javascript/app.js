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
    //indentify if it is update / insert
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
    // if new train
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

    // get snapshot key
    var trainid = record.key;

    // Store everything into a variable.
    var trainName = record.val().name;
    var dest = record.val().dest;
    var frequency = record.val().frequency;
    var st = record.val().fttime;
    //convert to military time
    var fttime = moment(st, "HH:mm");
    //get current time
    var endTime = moment();
    // difference between both times in mins
    var mins = endTime.diff(fttime, "minutes");

    var minSinceLast = mins % frequency;
    var minsRemaining = frequency - minSinceLast;

    var nextArrival = moment().add(minsRemaining, "minutes").format("HH:mm");


    // Add each train's data into the table
    $("#train-table > tbody").append("<tr class='train_tr' data-st='" + st + "' data-id='" + trainid + "'><td>" + trainName + "</td><td>" + dest + "</td><td class='fr'>" +
        frequency + "</td><td class='na'>" + nextArrival + "</td><td class='mr'>" + minsRemaining + "</td><td><button class='btn btn-warning upd' type='button' onClick='handleUpdate()'>Edit</button></td><td><button class='btn btn-danger del' type='button' onClick='handleDelete()'>Delete</button></td></tr>");
});
//handler to update table when a train is deleted
database.ref().on("child_removed", function(record) {
    var trainid = record.key;
    $(".train_tr").filter(function() {
        return $(this).attr('data-id') === trainid;
    }).remove();
});

//handler to update table when a train is modified
database.ref().on("child_changed", function(record) {
    var trainid = record.key;
    var trainName = record.val().name;
    var dest = record.val().dest;
    var frequency = record.val().frequency;
    var st = record.val().fttime;
    //convert to military time
    var fttime = moment(st, "HH:mm");
    //get current time
    var endTime = moment();
    // cal difference in mins
    var mins = endTime.diff(fttime, "minutes");

    var minSinceLast = mins % frequency;
    var minsRemaining = frequency - minSinceLast;
    var nextArrival = moment().add(minsRemaining, "minutes").format("HH:mm");
    // change the tr's innerHtml
    var content = "<td>" + trainName + "</td><td>" + dest + "</td><td class='fr'>" +
        frequency + "</td><td class='na'>" + nextArrival + "</td><td class='mr'>" + minsRemaining + "</td><td><button class='btn btn-warning upd' type='button' onClick='handleUpdate()'>Edit</button></td><td><button class='btn btn-danger del' type='button' onClick='handleDelete()'>Delete</button></td>";
    $(".train_tr").filter(function() {
        return $(this).attr('data-id') === trainid;
    }).html(content);
});

// update times on table for every minute
var timer = setInterval(function() {
    // get all the tr's in the table
    var rows = document.getElementsByClassName("train_tr");
    // loop for each row
    for (var i = 0; i < rows.length; i++) {
        // capture each train details
        var tr = rows[i];
        var st = tr.getAttribute("data-st");
        var fttime = moment(st, "HH:mm");
        var e = tr.children[2];
        var frequency = parseInt(e.innerText);
        var endTime = moment();
        // calcuate time diff in mins
        var mins = endTime.diff(fttime, "minutes");

        var minSinceLast = mins % frequency;
        var minsRemaining = frequency - minSinceLast;
        //calculate next arrival
        var nextArrival = moment().add(minsRemaining, "minutes").format("HH:mm");
        //update the NextArrival and MinsRemaining column
        tr.children[3].innerText = nextArrival;
        tr.children[4].innerText = minsRemaining;
    }

}, 60000);

//handler for delete btn click event
function handleDelete() {
    event.preventDefault();
    // get the train-key from the tr 
    var newPostKey = event.target.parentNode.parentNode.getAttribute("data-id");
    // create empty update rec
    var updates = {};
    updates[newPostKey] = null;
    // delete from firebase 
    return database.ref().update(updates);
};

//handler for edit btn click event
function handleUpdate() {
    event.preventDefault();
    //get key from the Update button's data attrib
    var newPostKey = event.target.parentNode.parentNode.getAttribute("data-id");
    // handle firebase update event
    var ref = firebase.database().ref(newPostKey);
    ref.once("value")
        .then(function(snapshot) {
            // get the train details
            var trainName = snapshot.val().name;
            var dest = snapshot.val().dest;
            var frequency = snapshot.val().frequency;
            var st = snapshot.val().fttime;
            // populate the form fields with the current details
            $("#train-name-input").val(trainName);
            $("#destination-input").val(dest);
            $("#frequency-input").val(frequency);
            $("#fttime-input").val(st);
            // modify 'Save' button to 'Update'
            $("#add-train-btn").html("Update");
            //add the data attrib to the 'Update' button
            $("#add-train-btn").attr("data-tr", snapshot.key);

        });
}