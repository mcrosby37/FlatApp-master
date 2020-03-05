import React, { Component } from "react";
import { FlatList, View, AsyncStorage, Text, TouchableOpacity, TouchableHighlight } from "react-native";
import * as firebase from "firebase";
import { Container, Content } from "native-base";
import { SimpleLineIcons, Entypo, AntDesign } from "@expo/vector-icons";
import { withMappedNavigationParams } from "react-navigation-props-mapper";
import styles from "./styles";

import I18n from "../../lib/i18n";
import ChatroomItem from "./chatroomItem";
import Analytics from "../../lib/analytics";
import _ from "lodash";

var specialChatrooms = {};

@withMappedNavigationParams()
class chatRooms extends Component {
  static navigationOptions = {
    title: I18n.t("chat"),
    tabBarIcon: <SimpleLineIcons style={{ backgroundColor: "transparent" }} name={"bubble"} color={"blue"} size={24} />
  };

  constructor(props) {
    super(props);
    this.state = {
      userChatrooms: {}
    };
  }

  componentDidMount() {
    this.props.navigation.setParams({
      refresh: this.refresh
    });

    const { navigation } = this.props;
    this.focusListener = navigation.addListener("didFocus", () => {
      // The screen is focused
      // Call any action
      console.log("chatRooms is focused");
      this.buildChatroomList();
    });

    Analytics.track("Chatrooms");
  }

  componentWillUnmount() {
    // Remove the event listener
    this.focusListener.remove();
  }

  refresh = ({ title }) => {
    console.log("nav refresh BBBB ", title);
    //this.props.navigation.setParams({ title: title });
  };

  keyExtractor = item => item.chatroom;

  buildChatroomList() {
    var userChatrooms = [];

    // if (global.email == "christinathorsen@gmail.com") {
    //   specialChatrooms = {
    //     chatroom: "sealysicochat",
    //     title: "App Developers Chat",
    //   };
    //   userChatrooms.push(specialChatrooms);
    // }
    this.loadFromAsyncStorage();

    firebase
      .firestore()
      .collection(global.domain)
      .doc("chat")
      .collection("chatrooms")

      .orderBy("title")
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log("No notifications");
          return;
        }
        const userInterestGroupCheck = _.has(global, "userInfo.interestGroups") && Array.isArray(global.userInfo.interestGroups);
        const userInterestGroups = userInterestGroupCheck ? global.userInfo.interestGroups : [];

        snapshot.forEach(doc => {
          const item = doc.data();

          if (item.visible == false) return;
          if (
            (item.type == "private" && item.members.indexOf(global.uid + "") > -1) ||
            (item.type == "interestGroup" && userInterestGroups && userInterestGroups.indexOf(item.title) > -1) ||
            ["users", "public"].indexOf(item.type) > -1
          ) {
            userChatrooms.push({
              ...item,
              chatroom: doc.id
            });
          }
        });

        AsyncStorage.setItem("userChatrooms", JSON.stringify(userChatrooms));

        this.setState({
          userChatrooms,
          loading: false
        });
      });
  }

  loadFromAsyncStorage() {
    AsyncStorage.getItem("userChatrooms").then(fi => {
      var userChatrooms = JSON.parse(fi);

      this.setState({
        userChatrooms,
        loading: false
      });
    });
  }

  _renderItem({ item }) {
    return <ChatroomItem {...item} navigation={this.props.navigation} card={true} />;
  }
  _renderItemNoCard({ item }) {
    return <ChatroomItem {...item} navigation={this.props.navigation} card={false} />;
  }

  render() {
    const card = this.props.card === false ? false : true;
    return (
      <Container style={styles.homeContainer}>
        <TouchableHighlight
          style={styles.addButton}
          underlayColor="#ff7043"
          onPress={() => {
            this.props.navigation.navigate("chatTitle", {
              edit: false,
              chatroom: "New Chatroom",
              onGoBack: this.refresh
            });
          }}>
          <Text style={{ fontSize: 25, color: "white" }}>+</Text>
        </TouchableHighlight>
        <Content showsVerticalScrollIndicator={false}>
          <View style={styles.newsContentLine}>
            <View>
              <View style={card && styles.card}>
                <View
                  style={{
                    flexDirection: "row",
                    paddingRight: 4,
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottomWidth: 0.1,
                    borderBottomColor: "lightgray",
                    marginTop: 5
                  }}>
                  <TouchableOpacity
                    style={{ flexDirection: "row" }}
                    onPress={() => {
                      this.props.navigation.navigate("chatTitle", {
                        edit: false,
                        chatroom: "New Chatroom",
                        onGoBack: this.refresh
                      });
                    }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <AntDesign style={styles.iconLeftPlus} name="pluscircleo" />
                      <Text style={styles.cardTitle}>New Chat Group</Text>
                      <Entypo style={styles.iconRight} name="chevron-right" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.card}>
                <View
                  style={{
                    flexDirection: "row",
                    paddingRight: 4,
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottomWidth: 0.1,
                    borderBottomColor: "lightgray"
                  }}>
                  <FlatList
                    data={this.state.userChatrooms}
                    renderItem={this._renderItemNoCard.bind(this)}
                    keyExtractor={this.keyExtractor}
                  />
                </View>
              </View>
            </View>
          </View>
        </Content>
      </Container>
    );
  }
}

export default chatRooms;
