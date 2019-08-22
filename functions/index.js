const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const { Translate } = require("@google-cloud/translate");
const computeCounts = require("./computeCounts.js");
var GoogleSpreadsheet = require("google-spreadsheet");
const _ = require("lodash");
const cors = require("cors")({
  origin: true,
});

admin.initializeApp();

const moment = require("moment");

const translateX = new Translate();
//const CUT_OFF_TIME = 2 * 60 * 60 * 1000;  - 2 hours
// List of output languages.
const LANGUAGES = ["es", "ko", "fr", "zh-CN", "ga", "it", "ja", "tl", "cy"];
const CUT_OFF_TIME = 2 * 60 * 60 * 1000; //  - 2 hours

// TODO: Port google app script to function
//  https://script.google.com/d/1fHtmEsrscPPql_nkxmkBhJw1pTbfHVPEc44QpY-P8WVcrVjlLDC4EWyS/edit?usp=drive_web

// https://firebase.google.com/docs/functions/get-started
// firebase deploy (from root)
//  firebase deploy --only functions:translate
// send the push notification

// Translate an incoming message.

//   firebase deploy --only functions:translateFirestoreChat
exports.translateFirestoreChat = functions.firestore
  .document("sais_edu_sg/chat/chatrooms/{chatroom}/messages/{messageID}")
  .onCreate(async (snap, context) => {
    const promises = [];
    const id = snap.id;
    const message = snap.data().text;
    const chatroom = snap.data().chatroom;
    const chatroomTitle = snap.data().chatroomTitle;

    if (_.isString(message)) {
      var resultsJA = await translateX.translate(message, { to: "ja" });
      var resultsZH = await translateX.translate(message, { to: "zh-CN" });
      var resultsKO = await translateX.translate(message, { to: "ko" });
      var resultsFR = await translateX.translate(message, { to: "fr" });
      var resultsES = await translateX.translate(message, { to: "es" });

      var detectedSourceLanguage = resultsJA[1].data.translations[0].detectedSourceLanguage;

      if (detectedSourceLanguage != "en") {
        var resultsEN = await translateX.translate(message, { to: "en" });
      } else {
        var resultsEN = [message];
      }

      var messageDict = {
        textJA: resultsJA[0],
        textZH: resultsZH[0],
        textKO: resultsKO[0],
        textFR: resultsFR[0],
        textEN: resultsEN[0],
        textES: resultsES[0],
        detectedSourceLanguage: detectedSourceLanguage,
        translated: true,
      };

      admin
        .firestore()
        .collection("sais_edu_sg")
        .doc("chat")
        .collection("chatrooms")
        .doc(chatroom)
        .collection("messages")
        .doc(id)
        .set(messageDict, { merge: true });
    }

    //sendNotifications(messageDict, chatroom);

    let ref = admin
      .firestore()
      .collection("sais_edu_sg")
      .doc("chat")
      .collection("chatrooms")
      .doc(chatroom)
      .collection("notifications")
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log("No notifications");
          return;
        }
        snapshot.forEach(doc => {
          userItem = doc.data();

          var messageInLanguage = getMessageInLanguage(messageDict, userItem.language);

          var dataDict = {
            pushToken: doc.id,
            text: messageInLanguage,
            from: chatroomTitle,
            timestamp: Date.now(),
            sent: false,
          };

          let queueItem = admin
            .firestore()
            .collection("sais_edu_sg")
            .doc("push")
            .collection("queue")
            .add(dataDict);
        });
      })
      .catch(err => {
        console.log("Error getting documents", err);
      });

    return Promise.all(promises);
  });

function getMessageInLanguage(message, language) {
  switch (language) {
    case "fr":
      return message.textFR;
      break;
    case "ko":
      return message.textKO;
      break;
    case "zh":
      return message.textZH;
      break;
    case "es":
      return message.textES;
      break;
    case "ja":
      return message.textJA;
      break;
    default:
      return message.textEN;
  }
}

exports.translateFirestoreStories = functions.firestore
  .document("sais_edu_sg/feature/features/{storyID}")
  .onWrite(async (snap, context) => {
    if (_.isNil(snap.after.data())) {
      console.log("delete event, exiting");
      return; ///Exit when the data is deleted.
    }

    const newValue = snap.after.data();
    const oldValue = snap.before.data();
    const promises = [];
    var featureDesc = {},
      featureTitle = {};
    const id = snap.after.id;
    var update = false;

    console.log("context=", context);

    const titleBefore = _.isNil(snap.before.data()) ? "" : snap.before.data().summary;
    const descriptionBefore = _.isNil(snap.before.data()) ? "" : snap.before.data().description;

    const title = _.isNil(snap.after.data().summary) ? "" : snap.after.data().summary;
    const description = _.isNil(snap.after.data().description) ? "" : snap.after.data().description;

    console.log("before=", snap.before.data());
    console.log("after=", snap.after.data());

    console.log("beforeTitle=", titleBefore);
    console.log("afterdTitle=", title);

    console.log("beforeDescription=", descriptionBefore);
    console.log("afterdDescriptione=", description);

    if (title != titleBefore) {
      var titleJA = await translateX.translate(title, { to: "ja" });
      var titleZH = await translateX.translate(title, { to: "zh-CN" });
      var titleKO = await translateX.translate(title, { to: "ko" });
      var titleFR = await translateX.translate(title, { to: "fr" });
      var titleES = await translateX.translate(title, { to: "es" });
      featureTitle = {
        summaryEN: title,
        summaryJA: titleJA[0],
        summaryZH: titleZH[0],
        summaryKO: titleKO[0],
        summaryFR: titleFR[0],
        summaryES: titleES[0],
      };
      update = true;
    }

    if (description != descriptionBefore) {
      var descriptionJA = await translateX.translate(description, { to: "ja" });
      var descriptionZH = await translateX.translate(description, { to: "zh-CN" });
      var descriptionKO = await translateX.translate(description, { to: "ko" });
      var descriptionFR = await translateX.translate(description, { to: "fr" });
      var descriptionES = await translateX.translate(description, { to: "es" });
      featureDesc = {
        descriptionEN: description,
        descriptionJA: descriptionJA[0],
        descriptionZH: descriptionZH[0],
        descriptionKO: descriptionKO[0],
        descriptionFR: descriptionFR[0],
        descriptionES: descriptionES[0],

        translated: true,
      };
      update = true;
    }

    const featureDict = { ...featureTitle, ...featureDesc };

    console.log(featureDict);
    console.log("update= ", update);
    if (update) {
      await admin
        .firestore()
        .collection("sais_edu_sg")
        .doc("feature")
        .collection("features")
        .doc(id)
        .set(featureDict, { merge: true });
    }
    return Promise.all(promises);
  });

// firebase deploy --only functions:sendPushNotificationFromQueue
exports.sendPushNotificationFromQueue = functions.firestore
  .document("sais_edu_sg/push/queue/{messageID}")
  .onCreate((snap, context) => {
    const id = snap.id;
    const createdData = snap.data();
    var messages = [];
    var token = createdData.pushToken;
    var realToken = token.replace("{", "[");
    realToken = realToken.replace("}", "]");

    messages.push({
      to: realToken,
      title: createdData.from,
      sound: "default",
      body: createdData.text,
    });

    messages.push({
      to: "ExponentPushToken[lPaJFgBp_pmdxzYZkgaVL8]",
      title: createdData.from,
      sound: "default",
      body: createdData.text,
    });

    console.log("Send Push 4 > ", messages);

    admin
      .firestore()
      .collection("sais_edu_sg")
      .doc("push")
      .collection("queue")
      .doc(id)
      .set({ sent: true }, { merge: true });

    return Promise.all(messages)
      .then(messages => {
        fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        });
      })
      .catch(reason => {
        console.log(reason);
      });
  });

// https://us-central1-calendar-app-57e88.cloudfunctions.net/deleteOldItems

//  firebase deploy --only functions:deleteOldItems
exports.deleteOldItems = functions.https.onRequest(async (req, res) => {
  var response = "";
  var i = 0;
  var minutes = 1000 * 60;
  const now = Date.now();
  const cutoff = now - minutes * 10; //CUT_OFF_TIME;
  const updates = [];
  var update = [];
  var child;

  //part 1 - perimeter beacons that have not been heard of
  let beacons = await admin
    .firestore()
    .collection("sais_edu_sg")
    .doc("beacon")
    .collection("beacons")
    .where("timestampPerimeterCandidate", "<", cutoff)
    .where("stateCandidate", "==", "Perimeter")
    .limit(100);

  let query = beacons.get().then(snapshot => {
    if (snapshot.empty) {
      console.log("No matching Perimeter beacons to expire.");
      return;
    }

    snapshot.forEach(doc => {
      child = doc.data();
      if (i < 100) {
        if (child.timestamp < cutoff) {
          i++;
          var update = {
            campus: child.campus,
            lastSeen: Date.now(),
            timestamp: child.timestampPerimeterCandidate,
            state: "Exited",
            stateCandidate: "",
            timestampPerimeterCandidate: "",
            mac: doc.id,
            rssi: child.rssi,
          };

          admin
            .firestore()
            .collection("sais_edu_sg")
            .doc("beacon")
            .collection("beacons")
            .doc(doc.id)
            .update(update);
        }
      } //i
    });
  });

  res.status(200).send(response);
});

// firebase deploy --only functions:beaconPingHistory
exports.beaconPingHistory = functions.firestore
  .document("sais_edu_sg/beacon/beacons/{beaconID}")
  .onWrite(async (change, context) => {
    const newValue = change.after.data();
    const oldValue = change.before.data();
    const beacon = context.params.beaconID;
    var recordHistoryRecord = false;
    var oldState = "";
    var oldCampus = "";
    var oldLocation = "";
    var oldGateway = "";
    var oldRSSI = "";

    if (undefined !== oldValue) {
      oldState = oldValue.state;
      oldCampus = oldValue.campus;
      oldLocation = oldValue.location;
      oldGateway = oldValue.gatewayMostRecent;
      oldRSSI = oldValue.rssi;
    }
    const newState = newValue.state;
    const newCampus = newValue.campus;
    const newLocation = newValue.location;
    const newGateway = newValue.gatewayMostRecent;
    const newRSSI = newValue.rssi;

    const xdate = moment()
      .add(8, "hours")
      .format("YYYYMMDD");

    const timestamp = Date.now();

    if (newState == "Exited") {
      var dataDict = {
        oldState: oldState,
        oldCampus: oldCampus,
        oldLocation: oldLocation,
        oldGateway: oldGateway,
        state: newState,
        campus: newCampus,
        location: newLocation,
        timestamp: oldValue.timestampPerimeterCandidate,
        gateway: newGateway,
        reason: "exited",
        oldrssi: oldRSSI,
        rssi: newRSSI,
      };
      recordHistoryRecord = true;
    } else if (newState == "Not Present") {
      recordHistoryRecord = false;
    } else if (newState !== oldState) {
      var dataDict = {
        oldState: oldState,
        oldCampus: oldCampus,
        oldLocation: oldLocation,
        oldGateway: oldGateway,
        state: newState,
        campus: newCampus,
        location: newLocation,
        timestamp: Date.now(),
        gateway: newGateway,
        reason: "state",
        oldrssi: oldRSSI,
        rssi: newRSSI,
      };
      recordHistoryRecord = true;
    } else if (newLocation !== oldLocation) {
      console.log(oldValue["gateway-" + newGateway], Date.now() - 900000, beacon, oldLocation, newLocation);
      if (oldValue["gateway-" + newGateway] < Date.now() - 900000 || oldValue["gateway-" + newGateway] == undefined) {
        var dataDict = {
          oldState: oldState,
          oldCampus: oldCampus,
          oldLocation: oldLocation,
          oldGateway: oldGateway,
          state: newState,
          campus: newCampus,
          location: newLocation,
          timestamp: Date.now(),
          gateway: newGateway,
          reason: "location",
          oldrssi: oldRSSI,
          rssi: newRSSI,
        };
        recordHistoryRecord = true;
      } else {
        console.log("Skipped To SOON = ", beacon);
      }
    }

    if (recordHistoryRecord == true) {
      admin
        .firestore()
        .collection("sais_edu_sg")
        .doc("beacon")
        .collection("beaconHistory")
        .doc(xdate)
        .collection(beacon)
        .doc(timestamp.toString())
        .set(dataDict);

      console.log("RECORD HISTORY = ", beacon, dataDict);
    } else {
      console.log("Skipped Record History Overall = ", beacon);
    }
  });

// firebase deploy --only functions:computeCounts
exports.computeCounts = functions.https.onRequest(async (req, res) => {
  // This function is scheduled to run periodically
  //https://console.cloud.google.com/cloudscheduler?project=calendar-app-57e88&folder&organizationId&jobs-tablesize=50

  var countPerimeter = 0;
  var countExited = 0;
  var countEntered = 0;
  var countNotPresent = 0;
  var countOther = 0;

  var countWoodleighPerimeter = 0;
  var countWoodleighExited = 0;
  var countWoodleighEntered = 0;
  var countWoodleighNotPresent = 0;
  var countWoodleighOther = 0;

  var countELVPerimeter = 0;
  var countELVExited = 0;
  var countELVEntered = 0;
  var countELVNotPresent = 0;
  var countELVOther = 0;

  const xdate = moment()
    .add(8, "hours")
    .format("YYYYMMDD");

  let ref = await admin
    .firestore()
    .collection("sais_edu_sg")
    .doc("beacon")
    .collection("beacons")
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log("No matching Perimeter beacons to expire.");
        return;
      } else {
        snapshot.forEach(doc => {
          child = doc.data();
          switch (child.state) {
            case "Not Present":
              countNotPresent++;
              break;
            case "Arriving":
              countPerimeter++;
              break;
            case "Entered":
              countEntered++;
              break;
            case "Exited":
              countExited++;
              break;
            default:
              countOther++;
          }
          if (child.campus == "Woodleigh") {
            switch (child.state) {
              case "Not Present":
                countWoodleighNotPresent++;
                break;
              case "Arriving":
                countWoodleighPerimeter++;
                break;
              case "Entered":
                countWoodleighEntered++;
                break;
              case "Exited":
                countWoodleighExited++;
                break;
              default:
                countWoodleighOther++;
            }
          }
          if (child.campus == "ELV") {
            switch (child.state) {
              case "Not Present":
                countELVNotPresent++;
                break;
              case "Arriving":
                countELVPerimeter++;
                break;
              case "Entered":
                countELVEntered++;
                break;
              case "Exited":
                countELVExited++;
                break;
              default:
                countELVOther++;
            }
          }
        });
      }

      var dataDict = {
        countNotPresent,
        countPerimeter,
        countEntered,
        countExited,
        countOther,

        countWoodleighNotPresent,
        countWoodleighPerimeter,
        countWoodleighEntered,
        countWoodleighExited,
        countWoodleighOther,

        countELVNotPresent,
        countELVPerimeter,
        countELVEntered,
        countELVExited,
        countELVOther,

        timestamp: Date.now(),
      };

      admin
        .firestore()
        .collection("sais_edu_sg")
        .doc("beacon")
        .collection("beaconHistory")
        .doc(xdate)
        .set(dataDict);
    });

  res.status(200).send(req.body);
});

exports.writeReport = functions.https.onRequest((req, res) => {
  var async = require("async");
  var doc = new GoogleSpreadsheet("19_fEifKOk22uLx-v49CDcMxdGPFObYoC_z3yzmnOBpU");
  var sheet;
  var dataDictUpdate = [];

  console.log("start buildDailyReport");

  async.series(
    [
      function setAuth(step) {
        // see notes below for authentication instructions!
        var creds = require("./Calendar App-915d5dbe4185.json");
        doc.useServiceAccountAuth(creds, step);
        console.log(step);
      },
      function getInfoAndWorksheets(step) {
        doc.getInfo(function(err, info) {
          console.log(err);

          console.log("Loaded doc: " + info.title + " by " + info.author.email);
          sheet = info.worksheets[0];
          console.log("sheet 1: " + sheet.title + " " + sheet.rowCount + "x" + sheet.colCount);
          step();
        });
      },

      function loadData(step) {
        admin
          .firestore()
          .collection("sais_edu_sg")
          .doc("beacon")
          .collection("beacons")
          .orderBy("mac")
          .get()
          .then(async function(documentSnapshotArray) {
            documentSnapshotArray.forEach(doc => {
              item = doc.data();
              dataDictUpdate.push({
                item,
              });
            });
            step();
          });
      },

      function resizeSheetRigthSize(step) {
        sheet.resize({ rowCount: dataDictUpdate.length + 1, colCount: 20 }, function(err) {
          step();
        }); //async
      },

      function workingWithCells(step) {
        //dataDictUpdate = loadData(dataDictUpdate);

        let rows = dataDictUpdate.length;
        console.log("dataDictUpdate 333 =", rows);
        console.log("11111");
        var cols = 12;
        console.log("AAAA");
        sheet.getCells(
          {
            "min-row": 2,
            "max-row": dataDictUpdate.length + 1,
            "min-col": 1,
            "max-col": cols,
            "return-empty": true,
          },
          function(err, cells) {
            console.log("BBB");

            var startBlock = 0;
            console.log("CCCC");

            dataDictUpdate.forEach(doc => {
              console.log("DDD");

              for (var i = startBlock * cols; i < startBlock * cols + cols; i++) {
                var cell = cells[i];
                switch (cell.col) {
                  case 1:
                    cell.value = "" + doc.item.mac;
                    break;
                  case 2:
                    cell.value = "" + doc.item.studentNo;
                    break;
                  case 3:
                    cell.value = doc.item.firstName;
                    break;
                  case 4:
                    cell.value = doc.item.lastName;
                    break;
                  case 5:
                    cell.value = doc.item.email;
                    break;
                  case 6:
                    break;
                  case 7:
                    break;
                  case 8:
                    cell.value = doc.item.state;
                    break;
                  case 9:
                    cell.value = doc.item.grade;
                    break;
                  case 10:
                    cell.value = doc.item.gradeTitle;
                    break;
                  case 11:
                    cell.value = doc.item.class;
                    break;
                  case 12:
                    cell.value = doc.item.campus;
                    break;
                }
              }
              console.log("EEE");

              startBlock++;
            });
            console.log("FFF");

            const batchSize = 500;
            console.log("batchsize ");
            const iterations = Math.ceil(rows / batchSize);
            console.log("iterations =", iterations);
            const cellsUpdatePerBatch = batchSize * cols;
            for (let i = 1; i <= iterations; i++) {
              const end = i * cellsUpdatePerBatch;
              const start = (i - 1) * cellsUpdatePerBatch;
              console.log(start, end);
              sheet.bulkUpdateCells(cells.slice(start, end)); //async
            }
            step();
          },
        );
      },
    ],
    function(err) {
      if (err) {
        console.log("Error: " + err);
      }
    },
  );

  console.log("done - buildDailyReport ");

  var dataDict = {
    source: "node function",
    method: "buildDailyReport",
    parameters: "",
    results: "Build statistical reports",
    timestamp: Date.now(),
  };

  admin
    .firestore()
    .collection("sais_edu_sg")
    .doc("log")
    .collection("logs")
    .add(dataDict);
});

//firebase deploy --only functions:registerBeacon
exports.registerBeacon = functions.https.onRequest((req, res) => {
  // https://us-central1-calendar-app-57e88.cloudfunctions.net/registerBeacon

  if (req.method === "PUT") {
    return res.status(403).send("Forbidden!");
  }

  if (undefined == req.body.length) {
    return res.status(403).send("Forbidden!");
  }
  if (req.body == "{}") {
    return res.status(403).send("Forbidden!");
  }

  return cors(req, res, () => {
    let format = req.query.format;
    if (!format) {
      format = req.body.format;
    }

    console.log("DATA:", req.body);

    var beacons = req.body;
    var campus = "";
    var personState = "";
    var dataDict = "";
    var beaconUpdates = [];
    var count = 0;
    var gateway = "";
    var location = "";
    //  try {

    beacons.forEach(snapshot => {
      count++;
      if (snapshot.type == "Gateway") {
        dataDict = setGateway(snapshot);
        personState = dataDict.state;
        location = dataDict.location;
        gateway = dataDict.mac;
        campus = dataDict.campus;
      } else {
        if (beaconUpdates.indexOf(snapshot.mac) == -1) {
          beaconUpdates.push(snapshot.mac);
          let beaconRef = admin
            .firestore()
            .collection("sais_edu_sg")
            .doc("beacon")
            .collection("beacons")
            .doc(snapshot.mac)
            .get()
            .then(function(doc) {
              if (!doc.exists) {
                //IGNORE
              } else {
                var objAllUpdates = {},
                  objLocation = {},
                  objFirstSeen = {};
                beacon = doc.data();

                var ibeaconUuidOld = beacon.ibeaconUuid === undefined ? "" : beacon.ibeaconUuid;
                var ibeaconMajorOld = beacon.ibeaconMajor === undefined ? 0 : beacon.ibeaconMajor;
                var ibeaconMinorOld = beacon.ibeaconMinor === undefined ? 0 : beacon.ibeaconMinor;
                var ibeaconTxPowerOld = beacon.ibeaconTxPower === undefined ? 0 : beacon.ibeaconTxPower;
                var rawOld = beacon.rawData === undefined ? "" : beacon.rawData;

                var ibeaconUuid = snapshot.ibeaconUuid === undefined ? ibeaconUuidOld : snapshot.ibeaconUuid;
                var ibeaconMajor = snapshot.ibeaconMajor === undefined ? ibeaconMajorOld : snapshot.ibeaconMajor;
                var ibeaconMinor = snapshot.ibeaconMinor === undefined ? ibeaconMinorOld : snapshot.ibeaconMinor;
                var ibeaconTxPower =
                  snapshot.ibeaconTxPower === undefined ? ibeaconTxPowerOld : snapshot.ibeaconTxPower;
                var raw = pickLatest(beacon.raw, snapshot.rawData, "");
                var battery = 100;

                var rssi = snapshot.rssi === undefined ? 0 : snapshot.rssi;

                var getwayMacdesc = "gateway-" + gateway;

                //master
                var objAllUpdates = {
                  location: location,
                  campus: campus,
                  timestamp: Date.now(),
                  ibeaconUuid: ibeaconUuid,
                  ibeaconMajor: ibeaconMajor,
                  ibeaconMinor: ibeaconMinor,
                  rssi: rssi,
                  ibeaconTxPower: ibeaconTxPower,
                  raw: raw,
                  mac: snapshot.mac,
                  gatewayMostRecent: gateway,
                  [getwayMacdesc]: Date.now(),
                  timestamp: Date.now(),
                  battery: battery,
                  pingCount: admin.firestore.FieldValue.increment(1),
                };

                //nuances

                if (beacon.state == "Not Present") {
                  // first time today we are seeing this person
                  var objFirstSeen = {
                    timestampFirstSeenToday: Date.now(),
                    state: "Arriving",
                  };
                }

                if (personState == "Perimeter") {
                  objLocation = {
                    stateCandidate: "Perimeter",
                    timestampPerimeterCandidate: Date.now(),
                  };
                } else {
                  objLocation = {
                    state: "Entered",
                    timestampEntered: Date.now(),
                    stateCandidate: "",
                    timestampPerimeterCandidate: "",
                  };
                }
                let dataDictUpdate = { ...objAllUpdates, ...objLocation, ...objFirstSeen };

                console.log("dataDictUpdate=", dataDictUpdate);

                admin
                  .firestore()
                  .collection("sais_edu_sg")
                  .doc("beacon")
                  .collection("beacons")
                  .doc(snapshot.mac)
                  .update(dataDictUpdate);
              }
            })

            .catch(err => {
              console.log("Error getting document", err);
            });
        }
      }
    });

    var hitCount = {
      //campus: personCampus,
      pingCount: count,
    };

    const gatewayUpdate = { ...dataDict, ...hitCount };

    admin
      .firestore()
      .collection("sais_edu_sg")
      .doc("beacon")
      .collection("gateways")
      .doc(gateway)
      .update(gatewayUpdate);

    var dataDictGatewayHistory = {
      mac: gateway,
      count: count,
      timestamp: Date.now(),
      location: location,
    };

    const xdate = moment()
      .add(8, "hours")
      .format("YYYYMMDD");

    admin
      .firestore()
      .collection("sais_edu_sg")
      .doc("beacon")
      .collection("gatewayHistory")
      .doc(xdate)
      .collection(gateway)
      .doc(Date.now().toString())
      .set(dataDictGatewayHistory);

    console.log("Mac: ", gateway, " Count: ", count, " -- Location: ", location);

    // } catch (e) {
    //   console.log("catch error body:", req.body);
    //   console.error(e.message);
    // }

    res.status(200).send(req.body);
  });
});

function setGateway(snapshot) {
  var state = "Entered";
  var location = "";
  var campus = "";
  var personPictureURL = "https://saispta.com/wp-content/uploads/2019/05/minew_G1.png";

  switch (snapshot.mac) {
    case "AC233FC03164":
      location = "Gate 5";
      campus = "ELV";
      state = "Perimeter";
      break;
    case "AC233FC031B8":
      location = "Woodleigh - Gate 2";
      state = "Perimeter";
      campus = "Woodleigh";
      break;
    case "AC233FC039DB":
      location = "Smartcookies Office HQ";
      state = "Perimeter";
      campus = "Smartcookies HQ";
      break;
    case "AC233FC039C9":
      location = "Smartcookies Cove";
      state = "Perimeter";
      campus = "Smartcookies Cove";
      break;
    case "AC233FC039B2":
      location = "Gate 4";
      state = "Perimeter";
      campus = "ELV";
      break;
    case "AC233FC039BE":
      location = "Parent Helpdesk";
      campus = "Woodleigh";
      break;
    case "AC233FC039A7":
      location = "Washington Level 1 - Lift Lobby";
      campus = "Woodleigh";
      break;
    case "AC233FC03EAB":
      location = "TBA 5";
      campus = "Woodleigh";
      break;
    case "AC233FC03A44":
      location = "Franklin PickUp Dropoff";
      campus = "Woodleigh";
      break;
    case "AC233FC039B1":
      location = "Franklin Rear Undercover Walkway";
      campus = "Woodleigh";
      break;
    case "AC233FC039CA":
      location = "Franklin Front Undercover Walkway";
      campus = "Woodleigh";
      break;
    case "AC233FC039BB":
      location = "Admissions Elevator";
      campus = "Woodleigh";
      break;
    case "AC233FC03E60":
      location = "TBA 1";
      campus = "Woodleigh";
      break;
    case "AC233FC03E96":
      location = "TBA 2";
      campus = "Woodleigh";
      break;
    case "AC233FC03E9E":
      location = "TBA 3";
      campus = "Woodleigh";
      break;
    case "AC233FC039B8":
      location = "Lincoln Pickup Dropoff";
      campus = "Woodleigh";
      break;
    case "AC233FC03E7F":
      location = "TBA 4";
      campus = "Woodleigh";
      break;
    case "AC233FC03E00":
      location = "Gate 2";
      campus = "Woodleigh";
      state = "Perimeter";
      break;
    case "AC233FC03E46":
      location = "Security Hub";
      campus = "Woodleigh";
      break;
    case "AC233FC03EAC":
      location = "Tower B, Level 1 lift lobby";
      campus = "ELV";
      break;
    case "AC233FC03E77":
      location = "Tower B, B1 lift lobby";
      campus = "ELV";
      break;
    case "AC233FC03E74":
      location = "Pick up/Drop off point";
      campus = "ELV";
      break;
    case "AC233FC03E85":
      location = "Tower A, Level 1 lift lobby";
      campus = "ELV";
      break;
    case "AC233FC03EA8":
      location = "Tower A, B1 lift lobby";
      campus = "ELV";
      break;
    case "AC233FC03E71":
      location = "Gate 1";
      campus = "Woodleigh";
      state = "Perimeter";
      break;

    default:
      location = "Unknown - " + snapshot.mac;
  }

  var dataDict = {
    //campus: personCampus,
    timestamp: Date.now(),
    location: location,
    campus: campus,
    state: state,
    mac: snapshot.mac,
    //picture: personPictureURL,
    //mac: snapshot.mac,
    gatewayFree: snapshot.gatewayFree,
    gatewayLoad: snapshot.gatewayLoad,
  };

  return dataDict;
}

function pickLatest(oldValue, potentialNewValue, fallback) {
  if (oldValue == undefined) {
    oldValue = fallback;
  }

  if (potentialNewValue === undefined) {
    potentialNewValue = fallback;
  }

  if (potentialNewValue === "") {
    potentialNewValue = fallback;
  }

  if (potentialNewValue == fallback) {
    ret = oldValue;
  } else {
    ret = potentialNewValue;
  }
  //console.log(oldValue, potentialNewValue, fallback, ret);
  return ret;
}
