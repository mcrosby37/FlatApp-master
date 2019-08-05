import * as firebase from "firebase";
import ApiKeys from "../ApiKeys";
import { AsyncStorage } from "react-native";
import _ from "lodash";

class Firebase {
  static initialise() {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(ApiKeys.FirebaseConfig);
      }

      firebase
        .auth()
        .signInAnonymously()
        .catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // ...
        });
    } catch (e) {
      console.log("catch error body:", e.message);
      //console.error(e.message);
    }

    try {
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          var isAnonymous = user.isAnonymous;
          var uid = user.uid;
          console.log("Auth = ", uid);

          // store the auth as a valid user
          global.uid = uid;

          let ref = firebase
            .firestore()
            .collection("sais_edu_sg")
            .doc("user")
            .collection("usernames")
            .doc(uid)
            .get()
            .then(doc => {
              if (!doc.exists) {
                console.log("No such document!");
              } else {
                var docData = doc.data();
                console.log("Document data:", docData.gradeNotify);
                for (var i = -4; i < 13; i++) {
                  if (docData.gradeNotify[i] != undefined && docData.gradeNotify[i] >= -4) {
                    //grades.push(docData.gradeNotify[i]);
                    console.log("loop=", docData.gradeNotify[i]);
                  }
                }
                console.log("json1=", JSON.stringify(docData.gradeNotify));
                AsyncStorage.setItem("gradeNotify", JSON.stringify(docData.gradeNotify));
              }
            });

          var token = global.pushToken;

          if (_.isNil(token)) {
            token = "";
          }
          var safeToken = global.safeToken;
          console.log("safeToken=", safeToken);

          if (_.isNil(safeToken)) {
            safeToken = "";
          }

          var userDict = {
            uid: uid,
            token,
            safeToken,
            loginCount: firebase.firestore.FieldValue.increment(1),
          };

          try {
            console.log(safeToken);
            firebase
              .firestore()
              .collection("sais_edu_sg")
              .doc("user")
              .collection("usernames")
              .doc(uid)
              .set(userDict, { merge: true });
          } catch (error) {
            console.log(error);
            // Error saving data
          }
        } else {
          // User is signed out.
        }
      });
    } catch (e) {
      console.log("catch error body:", e.message);
      //console.error(e.message);
    }
  }
}

export default Firebase;
