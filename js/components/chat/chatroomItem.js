import React, { Component } from "react";
import {
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";

import { Container, Content, Text, Button, Icon } from "native-base";
import styles from "./styles";
import { Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import { isAdmin } from "../global.js";
import { Image } from "react-native-expo-image-cache";

const { width } = Dimensions.get("window");

class ChatroomItem extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    //var photoSquare = this.props.item.item.photoSquare;
    //var photo1 = this.props.item.item.photo1;

    const preview = {
      uri:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAABaCAMAAAC4y0kXAAAAA1BMVEX///+nxBvIAAAAIElEQVRoge3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAPBgKBQAASc1kqgAAAAASUVORK5CYII="
    };
   //const uri = this.props.item.item.photo1;

    return (
      <View style={styles.chatRow}>
        <Button
        
          transparent
          style={styles.roundedButton}
          onPress={() => {
            Actions.chat({ chatroom: this.props.item });
          }}
        >
          <Icon style={styles.icon} name="ios-chatbubbles" />
        </Button>

        <View>
             <Text style={styles.chatTitle}>{this.props.item}</Text>
             <Text style={styles.chatDescription}>{this.props.description}</Text>
        </View>
      </View>
    );
  }
}

module.exports = ChatroomItem;
