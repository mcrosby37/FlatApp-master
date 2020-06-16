
import React, { Component } from "react";
import { View, TouchableHighlight, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Text } from "./sComponent"


export const SettingsListItem = class SettingsListItem extends Component {
	render() {
		const { icon, onPress, title, titleInfoStyle, titleInfo, hasNavArrow = true } = this.props;
		return <TouchableHighlight onPress={onPress}>
			<View style={styles.outerView}>
				{icon}
				<View style={styles.innerView}>
					<View>
						<Text style={[titleInfoStyle, { color: "#333333" }]}>{title || ""}</Text>
					</View>

					<View>
						<Text style={[titleInfoStyle, { color: "#777777" }]}>{titleInfo || ""}</Text>
					</View>
				</View>

				<View style={styles.rightChevron}>{hasNavArrow && <Feather name="chevron-right" size={22} color="#777777" />}</View>
			</View>
		</TouchableHighlight>;
	}
};

const styles = StyleSheet.create({
	innerView: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 8
	},
	outerView: {
		alignItems: "center",
		backgroundColor: "white",
		borderBottomColor: "#CED0CE",
		borderBottomWidth: 1,
		flexDirection: "row",
		paddingVertical: 8
	},
	rightChevron: {
		marginHorizontal: 8
	},
	separator: {
		backgroundColor: "#CED0CE",
		height: 1,
		marginTop: 30,
		width: "100%"
	}
});

export const Separator = class Separator extends Component {
	render() {
		return <View style={styles.separator} />;
	}
};