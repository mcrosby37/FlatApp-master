import React, { Component } from "react";
import { Platform, Text, View, Alert, TouchableOpacity, AsyncStorage, Linking } from "react-native";
import { connect } from "react-redux";
import { ActionSheet, Container, Footer } from "native-base";

import { GiftedChat, Bubble, SystemMessage, Time, Send } from "react-native-gifted-chat";
import { SimpleLineIcons, MaterialIcons, Entypo } from "@expo/vector-icons";
import { ImagePicker, Permissions } from "expo";

import emojiUtils from "emoji-utils";
import Constants from "expo-constants";
import { bindActionCreators } from "redux";
import CustomActions from "./customActions";
import CustomView from "./customView";
import CustomImage from "./customImage";
import CustomVideo from "./customVideo";
import styles from "./styles";
import I18n from "../../lib/i18n";

import * as ActionCreators from "../../actions";

import Backend from "./backend";
import SlackMessage from "./slackMessage";

const tabBarIcon = name => ({ tintColor }) => (
  <SimpleLineIcons style={{ backgroundColor: "transparent" }} name={name} color={tintColor} size={24} />
);

class chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      loadEarlier: true,
      typingText: null,
      isLoadingEarlier: false,
      step: 0,
      muteState: false,
      language: "",
      user: null,
    };

    this._isMounted = false;
    this.onSend = this.onSend.bind(this);
    this.parsePatterns = this.parsePatterns.bind(this);

    this.onReceive = this.onReceive.bind(this);
    this.renderCustomActions = this.renderCustomActions.bind(this);
    this.renderBubble = this.renderBubble.bind(this);
    this.renderSystemMessage = this.renderSystemMessage.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.onLoadEarlier = this.onLoadEarlier.bind(this);

    this._isAlright = null;
  }

  static navigationOptions = ({ navigation }) => ({
    headerBackTitle: null,
    headerLeft: (
      <TouchableOpacity
        onPress={() => {
          navigation.goBack();
        }}
      >
        <Entypo name="chevron-left" style={styles.chatHeadingLeft} />
      </TouchableOpacity>
    ),

    headerTitle: (
      <TouchableOpacity
        onPress={() => {
          navigation.state.params._showActionSheet();
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "600" }}>{navigation.getParam("chatroom")}</Text>
      </TouchableOpacity>
    ),
    headerRight: (
      <TouchableOpacity
        onPress={() => {
          navigation.state.params._showActionSheet();
        }}
      >
        <View style={styles.chatHeading}>
          <Entypo name="cog" style={styles.chatHeading} />
        </View>
      </TouchableOpacity>
    ),
  });

  componentWillMount() {
    if (this.props.userX.nickname) {
    } else {
      this.noNickname();
      this.props.navigation.navigate("login");
    }
    this._retrieveLanguage();

    this._isMounted = true;
  }

  componentDidMount() {
    this.getPermissionAsync();

    this.props.navigation.setParams({
      _showActionSheet: this._showActionSheet,
    });

    // Backend.setLanguage(this.props.userX.language);
    Backend.setChatroom(this.props.navigation.getParam("chatroom"));

    Backend.loadMessages(this.state.language, message => {
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, message),
      }));
    });
  }

  getPermissionAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
      }
    }
  };

  componentWillUnmount() {
    this._isMounted = false;
    Backend.closeChat();
  }

  _retrieveLanguage = async () => {
    try {
      const value = await AsyncStorage.getItem("language");
      if (value !== null) {
        // We have data!!
        this.setState({ language: value });
      }
    } catch (error) {
      // Error retrieving data
    }
  };

  noNickname() {
    Alert.alert(
      "Chat Name",
      "Please enter a Name to Chat",
      [{ text: "OK", onPress: () => console.log("OK Pressed") }],
      { cancelable: false },
    );
  }

  avatarPress = props => {
    Alert.alert(props.name);
  };

  onLoadEarlier() {
    this.setState(previousState => ({
      isLoadingEarlier: true,
    }));

    setTimeout(() => {
      if (this._isMounted === true) {
        this.setState(previousState => ({
          messages: GiftedChat.prepend(previousState.messages, require("./old_messages.js")),
          loadEarlier: false,
          isLoadingEarlier: false,
        }));
      }
    }, 2000); // simulating network
  }

  onSend(messages = []) {
    Backend.SendMessage(messages);
  }

  onReceive(text) {}

  renderCustomActions(props) {
    return (
      <TouchableOpacity style={styles.photoContainer} onPress={this._pickImage}>
        <View>
          <Entypo name="camera" style={{ fontSize: 25, color: "#0284FF" }} />
        </View>
      </TouchableOpacity>
    );
  }

  _pickImage = async () => {
    var images = [];
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });

    if (!result.cancelled) {
      //this.setState({ image: result.uri });
      //this._images = images;
      images[0] = {
        image: result.uri,
        filename: result.uri,
        user: {
          _id: Constants.installationId, // `${Constants.installationId}${Constants.deviceId}`, // sent messages should have same user._id
          name: this.props.userX.nickname,
        },
      };

      this.onSend(images);
      //Backend.SendMessage(image);
      //uploadUrl = await uploadImageAsync(images.uri);
    }
  };

  renderSystemMessage(props) {
    return (
      <SystemMessage
        {...props}
        containerStyle={{
          marginBottom: 15,
        }}
        textStyle={{
          fontSize: 14,
        }}
      />
    );
  }

  renderCustomView(props) {
    return <CustomView {...props} />;
  }

  renderCustomImage(props) {
    return <CustomImage {...props} />;
  }

  renderCustomVideo(props) {
    return <CustomVideo {...props} />;
  }

  renderFooter(props) {
    if (this.state.typingText) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{this.state.typingText}</Text>
        </View>
      );
    }
    return null;
  }

  renderMessage(props) {
    const {
      currentMessage: { text: currText },
    } = props;

    let messageTextStyle;

    // Make "pure emoji" messages much bigger than plain text.
    if (currText && emojiUtils.isPureEmojiString(currText)) {
      messageTextStyle = {
        fontSize: 28,
        // Emoji get clipped if lineHeight isn't increased; make it consistent across platforms.
        lineHeight: Platform.OS === "android" ? 34 : 30,
      };
    }

    return <SlackMessage {...props} messageTextStyle={messageTextStyle} />;
  }

  renderBubble = props => {
    const username = this.props.userX.nickname;
    const color = this.getColor(username);

    var myimage = props.currentMessage.image;

    if (props.currentMessage.image) {
      return (
        <Bubble
          {...props}
          wrapperStyle={{
            left: {
              backgroundColor: "white",
            },
            right: {
              backgroundColor: "white",
            },
          }}
        />
      );
    } else {
      return (
        <Bubble
          {...props}
          textStyle={{
            right: {
              color: "white",
            },
          }}
        />
      );
    }
  };

  get user() {
    // Return our name and our UID for GiftedChat to parse

    return {
      name: this.props.userX.nickname,
      _id: Constants.installationId,
    };
  }

  getColor(username) {
    let sumChars = 0;
    for (let i = 0; i < 10; i++) {
      sumChars += 5;
    }

    const colors = [
      "#d6cfc7", // carrot
      "#c7c6c1", // emerald
      "#bebdb8", // peter  river
      "#bdb7ab", // wisteria
      "#d9dddc", // alizarin
      "#b9bbb6", // turquoise
      "#808588", // midnight blue
    ];
    return colors[sumChars % colors.length];
  }

  parsePatterns(linkStyle) {
    return [
      {
        pattern: /#(\w+)/,
        style: { ...linkStyle, color: "orange" },
        onPress: () => Linking.openURL("http://gifted.chat"),
      },
    ];
  }

  renderTime() {
    return (
      <Time
        textStyle={{
          right: {
            color: "blue",
            // fontFamily: 'Montserrat-Light',
            fontSize: 14,
          },
          left: {
            color: "green",
            // fontFamily: 'Montserrat-Light',
            fontSize: 14,
          },
        }}
      />
    );
  }

  _showActionSheet() {
    const BUTTONS = ["Mute conversation", "Unmute conversation", "Cancel"];
    const CANCEL_INDEX = 2;

    ActionSheet.show(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        // destructiveButtonIndex: DESTRUCTIVE_INDEX,
        title: "Options",
      },

      buttonIndex => {
        switch (buttonIndex) {
          case 0:
            Backend.setMute(true);
            break;
          case 1:
            Backend.setMute(false);
            break;
        }
      },
    );
  }

  renderSend(props) {
    return (
      <Send {...props}>
        <View style={{ marginRight: 10, marginBottom: 10 }}>
          <MaterialIcons name="send" style={{ fontSize: 25, color: "#0284FF" }} />
        </View>
      </Send>
    );
  }

  render() {
    return (
      <Container>
        <View>
          <TouchableOpacity
            onPress={() => {
              this.props.navigation.navigate("selectLanguage", {
                chatroom: this.props.title,
                description: this.props.description,
                contact: this.props.contact,
                url: this.props.url,
              });
            }}
          >
            <View style={styles.topbar}>
              <Text style={styles.chatBanner}>Translations by Google Translate</Text>
            </View>
          </TouchableOpacity>
        </View>

        <GiftedChat
          messages={this.state.messages}
          onSend={this.onSend}
          // loadEarlier={this.state.loadEarlier}
          // onLoadEarlier={this.onLoadEarlier}
          // isLoadingEarlier={this.state.isLoadingEarlier}
          user={{
            _id: Constants.installationId, // `${Constants.installationId}${Constants.deviceId}`, // sent messages should have same user._id
            name: this.props.userX.nickname,
            // avatar: 'https://www.sais.edu.sg/sites/all/themes/custom/saissg/favicon.ico',
          }}
          renderActions={this.renderCustomActions}
          renderSystemMessage={this.renderSystemMessage}
          renderCustomView={this.renderCustomView}
          renderMessageImage={this.renderCustomImage}
          // renderFooter={this.renderFooter}
          // showAvatarForEveryMessage
          // showUserAvatar
          // parsePatterns={this.parsePatterns}
          renderMessageVideo={this.renderCustomVideo}
          renderBubble={this.renderBubble}
          // renderAvatar={this.renderAvatar.bind(this)}
          // renderTime={this.renderTime.bind(this)}
          showUserAvatar
          // showAvatarForEveryMessage={true}
          chatId={this.chatId}
          // minInputToolbarHeight={50}
          bottomOffset={0}
          onPressAvatar={this.avatarPress}
          alwaysShowSend={true}
          renderSend={this.renderSend}
        />

        <Footer style={styles.footer} />
      </Container>
    );
  }
}

const _pickVideo = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
  });

  if (!result.cancelled) {
    //this.setState({ image: result.uri });
  }
};

const mapDispatchToProps = dispatch => bindActionCreators(ActionCreators, dispatch);

const mapStateToProps = state => ({
  //navigation: state.cardNavigation,
  username: state.username,
  userX: state.user,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(chat);
