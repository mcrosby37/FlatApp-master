import React, { useState, useEffect } from "react";

import { Text, StyleSheet, View, TouchableOpacity, TouchableHighlight, SafeAreaView } from "react-native";
import { Button, Overlay } from "react-native-elements";

import { Feather, FontAwesome } from "@expo/vector-icons";
import Tooltip from "react-native-walkthrough-tooltip";
import useBeaconSearchHook from "./utils/BeaconSearchStore";
const moment = require("moment");
import * as firebase from "firebase";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

const AttendanceStats = ({ navigation }) => {
  const [globalBeaconSearchState, globalBeaconSearchAction] = useBeaconSearchHook();

  const [enteredToolTipVisible, setEnteredToolTipVisible] = useState(false);
  const [totalToolTipVisible, setTotalToolTipVisible] = useState(false);
  const [exitedToolTipVisible, setExixtedToolTipVisible] = useState(false);
  const [perimeterToolTipVisible, setPerimeterToolTipVisible] = useState(false);
  const [notpresentToolTipVisible, setNotpresentToolTipVisible] = useState(false);

  const [countDict, setCountDict] = useState({});
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [maxDate, setMaxDate] = useState(moment().format("YYYY-MM-DD"));
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [tempSelectedDate, setTempSelectedDate] = useState("");

  useEffect(() => {
    console.log("useEffect selectedDate", selectedDate);

    let ref = firebase
      .firestore()
      .collection("sais_edu_sg")
      .doc("beacon")
      .collection("beaconHistory")
      .doc(moment(selectedDate).format("YYYYMMDD"));

    let historyDoc = ref
      .get()
      .then(doc => {
        if (!doc.exists) {
          console.log("No such document!");
        } else {
          console.log("Document data:", doc.data());
          var countData = doc.data();

          const countDict = {
            countNotPresent: countData.countNotPresent,
            countPerimeter: countData.countPerimeter,
            countEntered: countData.countEntered,
            countExited: countData.countExited,
            countOther: countData.countOther,
            countTotal:
              countData.countNotPresent + countData.countPerimeter + countData.countEntered + countData.countExited,
          };

          //Purple Flag

          setCountDict(countDict);
        }
      })
      .catch(err => {
        console.log("Error getting document", err);
      });
  }, [selectedDate]);

  const routeBtn = state => {
    globalBeaconSearchAction.setBeaconState(state);
    navigation.navigate("GradeListingScreen");
  };

  const infoToolTip = (tooltipText, visibleState, setVisibleState) => {
    return (
      <View>
        <Tooltip
          animated
          isVisible={visibleState}
          content={<Text>{tooltipText}</Text>}
          placement="top"
          onClose={() => setVisibleState(false)}
        >
          <TouchableHighlight onPress={() => setVisibleState(true)}>
            <FontAwesome name="info-circle" size={20} color="#DDDDDD" />
          </TouchableHighlight>
        </Tooltip>
      </View>
    );
  };

  const renderViewMore = () => (
    <View
      style={{
        position: "absolute",
        bottom: 0.5,
        left: 0,
        width: "100%",
        flexDirection: "row",
        borderTopColor: "#d3d3d3",
        borderTopWidth: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 8, color: "#d3d3d3" }}>View More</Text>
      <Feather name="chevron-right" size={8} color="#DDDDDD" style={{ paddingTop: 1 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* {Calendar Pop up} */}
      <Overlay
        isVisible={calendarModalVisible}
        onBackdropPress={() => {
          setCalendarModalVisible(false);
        }}
        windowBackgroundColor="rgba(0, 0, 0, .8)"
        width="auto"
        height="auto"
      >
        <SafeAreaView>
          <TouchableOpacity
            onPress={() => {
              setCalendarModalVisible(false);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 10,
            }}
          >
            <Ionicons name="md-close" size={28} color="gray" />
          </TouchableOpacity>
          <View style={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 10 }}>
            <Text style={{ marginBottom: 15, fontWeight: "bold" }}>Select Date</Text>
            <Calendar
              maxDate={maxDate}
              onDayPress={day => {
                setTempSelectedDate(day.dateString);
              }}
              markedDates={{
                [tempSelectedDate]: { selected: true, disableTouchEvent: true },
              }}
            />
            <Button
              title="Submit"
              onPress={() => {
                setSelectedDate(tempSelectedDate);
                setCalendarModalVisible(false);
              }}
              containerStyle={{ marginTop: 15 }}
            />
          </View>
        </SafeAreaView>
      </Overlay>

      <View style={{ paddingVertical: 5, paddingHorizontal: 10 }}>
        <Button
          title={moment(selectedDate).format("LL")}
          raised
          icon={
            <View style={{ paddingRight: 10 }}>
              <FontAwesome name="calendar" size={15} color="#48484A" />
            </View>
          }
          buttonStyle={{ backgroundColor: "#d3d3d3", padding: 2 }}
          titleStyle={{ color: "#48484A", fontSize: 14 }}
          onPress={() => {
            setCalendarModalVisible(true);
          }}
        />
      </View>

      <View style={styles.stats}>
        <View style={styles.statsCol}>
          <TouchableOpacity style={[styles.widget, { backgroundColor: "#0074D9" }]} onPress={() => routeBtn("Entered")}>
            <View style={styles.widgetContainer}>
              <View style={styles.widgetTitleContainer}>
                <Text style={styles.widgetTextTitle}>On Campus </Text>
                {infoToolTip("On Campus\n(inside ping)", enteredToolTipVisible, setEnteredToolTipVisible)}
              </View>

              <Text style={styles.widgetTextContent}>{countDict.countEntered}</Text>
              {renderViewMore()}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.widget, { backgroundColor: "olivedrab" }]}
            onPress={() => routeBtn("Exited")}
          >
            <View style={styles.widgetContainer}>
              <View style={styles.widgetTitleContainer}>
                <Text style={styles.widgetTextTitle}>Exited </Text>
                {infoToolTip(
                  "Exited\n(last ping at perimeter then not seen for 10 mins)",
                  exitedToolTipVisible,
                  setExixtedToolTipVisible,
                )}
              </View>

              <Text style={styles.widgetTextContent}>{countDict.countExited}</Text>
              {renderViewMore()}
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.statsCol}>
          <TouchableOpacity style={[styles.widget, { backgroundColor: "darkorchid" }]} onPress={() => routeBtn("")}>
            <View style={[styles.widgetContainer, { paddingBottom: 12, paddingTop: 5 }]}>
              <View style={styles.widgetTitleContainer}>
                <Text style={styles.widgetTextTitle}>Total </Text>
                {infoToolTip("Total\n(number of students in the system)", totalToolTipVisible, setTotalToolTipVisible)}
              </View>

              <Text style={styles.widgetTextContent}>{countDict.countTotal}</Text>
              {renderViewMore()}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.widget, { backgroundColor: "#FF4136" }]}
            onPress={() => routeBtn("Perimeter")}
          >
            <View style={[styles.widgetContainer, { paddingBottom: 12, paddingTop: 5 }]}>
              <View style={styles.widgetTitleContainer}>
                <Text style={styles.widgetTextTitle}>Perimeter </Text>
                {infoToolTip("Perimeter\n(gate 1 or 2)", perimeterToolTipVisible, setPerimeterToolTipVisible)}
              </View>

              <Text style={styles.widgetTextContent}>{countDict.countPerimeter}</Text>
              {renderViewMore()}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.widget, { backgroundColor: "tomato" }]}
            onPress={() => routeBtn("Not Present")}
          >
            <View style={[styles.widgetContainer, { paddingBottom: 12, paddingTop: 5 }]}>
              <View style={styles.widgetTitleContainer}>
                <Text style={styles.widgetTextTitle}>Not Present </Text>
                {infoToolTip(
                  "Not Present\n(no pings for the day)",
                  notpresentToolTipVisible,
                  setNotpresentToolTipVisible,
                )}
              </View>

              <Text style={styles.widgetTextContent}>{countDict.countNotPresent}</Text>
              {renderViewMore()}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    // backgroundColor: '#d3d3d3'
  },
  stats: {
    flex: 1,
    flexDirection: "row",
  },
  statsCol: {
    flex: 1,
    flexDirection: "column",
  },
  widget: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    margin: 3,
    flex: 1,
    padding: 2,
    borderRadius: 8,
  },
  widgetContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  widgetTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  widgetTextTitle: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
    color: "#DDDDDD",
  },
  widgetTextContent: {
    fontSize: 28,
    textAlign: "center",
    color: "#333",
  },
});

export default AttendanceStats;
