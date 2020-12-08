import React, { Component } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import * as Updates from 'expo-updates';
import * as Analytics from 'expo-firebase-analytics';
import { connect } from "react-redux";
import { setAdminPass } from "../store/auth";
import { Input } from "react-native-elements";
import I18n from "../lib/i18n";
import { Text } from "../components/sComponent";

export class AdminPassword extends Component {
	constructor(props) {
		super(props);
		this.state = {
			adminPassword: "enter password",
			adminPasswordCorrect: "",
			restartMessage: ""
		};
	}

	componentDidMount() {
		this._retrieveAdminPassword();
	}

	_retrieveAdminPassword = async () => {
		try {
			const value = this.props.auth.adminPassword;
			if (value !== null) {
				if (value == global.admin_password) {
					this.setState({ adminPasswordCorrect: "Password Correct!" });
				}
				this.setState({ adminPassword: value });
			}
		} catch (error) {
			// Error retrieving data
		}
	};

	_setAdminPassword(adminPassword) {
		this.setState({ adminPassword: adminPassword });
		if (adminPassword == global.admin_password) {
			this.setState({ adminPasswordCorrect: "Password Correct!" });
			this.setState({ restartMessage: "Click to Restart in Admin Mode" });
			Analytics.logEvent("Admin Password", { entered: "Correct" });

			global.adminPassword = adminPassword;

			this.props.dispatch(setAdminPass(adminPassword));
		} else {
			this.setState({ adminPasswordCorrect: "" });
		}
	}
	_saveButton() {
		if (this.state.adminPassword == global.admin_password) {
			return <TouchableOpacity style={styles.SubmitButtonStyle} activeOpacity={0.5} onPress={() => Updates.reloadAsync()}>
				<Text style={styles.TextStyle}>{I18n.t("save")}</Text>
			</TouchableOpacity>;
		}
	}

	render() {
		return <View style={styles.container}>
			<Input
				style={styles.passwordField}
				onChangeText={text => this._setAdminPassword(text)}
				placeholder={I18n.t("password")}
				containerStyle={styles.containerStyle}
				inputContainerStyle={styles.inputBorder}
				autoCapitalize="none"
				testID="admin.password"
				autoFocus={true} />
			<View style={styles.saveButton}>{this._saveButton()}</View>
		</View>;
	}

}

const styles = StyleSheet.create({
	SubmitButtonStyle: {
		alignItems: "center",
		backgroundColor: "#fff",
		borderRadius: 25,
		elevation: 4,
		height: 50,
		justifyContent: "center",
		marginBottom: 30,
		shadowColor: "rgba(0,0,0, .4)",
		shadowOffset: { height: 2, width: 2 },
		shadowOpacity: 0.8,
		shadowRadius: 1,
		width: 250
	},
	TextStyle: {
		color: "green"
	},
	container: {
		backgroundColor: "#f2f2f2",
		flex: 1,
		padding: 10
	},

	containerStyle: {
		backgroundColor: "#ffffff",
		borderColor: "#d2d2d2",
		borderRadius: 10,
		borderWidth: 1,
		marginVertical: 8
	},
	inputBorder: { borderBottomWidth: 0 },
	passwordField: {
		borderColor: "gray",
		borderWidth: 1,
		height: 40,
		paddingLeft: 10
	},
	saveButton: { alignItems: "center", flexDirection: "column", marginTop: 12 }
});

const mapStateToProps = state => ({
	auth: state.auth
});
export default connect(mapStateToProps)(AdminPassword);