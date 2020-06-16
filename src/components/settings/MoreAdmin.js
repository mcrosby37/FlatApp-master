
import React, { createRef } from "react";
import { StyleSheet, Text, View, FlatList, PanResponder, Animated, SafeAreaView, Button, TouchableOpacity, TouchableHighlight, TextInput, Image, ScrollView, Switch } from "react-native";
import * as firebase from "firebase";
import { FontAwesome } from "@expo/vector-icons";
import RadioButton from "../RadioButton";
import { Overlay } from "react-native-elements";
import { saveFeatureChanges } from "../../store/settings";
import { connect } from "react-redux";

const navHeight = 0; //Header.HEIGHT;

function immutableMove(arr, from, to) {
	return arr.reduce((prev, current, idx, self) => {
		if (from === to) {
			prev.push(current);
		}
		if (idx === from) {
			return prev;
		}
		if (from < to) {
			prev.push(current);
		}
		if (idx === to) {
			prev.push(self[from]);
		}
		if (from > to) {
			prev.push(current);
		}
		return prev;
	}, []);
}

class ContactAdmin extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: "Edit More",
		headerRight: <TouchableOpacity onPress={() => {
			navigation.state.params.saveChanges(navigation.goBack);
		}}>
			<Text style={styles.a9f94cc50af6811ea88c25dbffc760ad0}>
				Save
        </Text>
		</TouchableOpacity>
	});

	state = {
		dragging: false,
		draggingIdx: -1,
		data: this.props.settings.features || [],
		modalVisible: false,

		editIdx: -1,
		editNavURL: "",
		editIcon: "",
		editTitle: "",
		editTitleInfo: "",
		editVisible: true
	};

	setEditIcon = t => this.setState({ editIcon: t });
	resetEditFields = callback => this.setState({
		editIdx: -1,
		editNavURL: "",
		editIcon: "",
		editTitle: "",
		editTitleInfo: "",
		editVisible: true
	}, () => typeof callback === "function" && callback());

	updateData = callback => {
		const {
			data,
			editIdx = -1,
			editNavURL = "",
			editIcon = "",
			editTitle = "",
			editTitleInfo = "",
			editVisible = true
		} = this.state;

		const updatedData = {
			icon: editIcon,
			navURL: editNavURL,
			title: editTitle,
			titleInfo: editTitleInfo,
			visible: editVisible
		};

		if (editIdx > -1) {
			// update current contact info
			data[editIdx] = updatedData;
			this.setState({ data }, () => typeof callback === "function" && callback());
		} else {
			//add new contact info
			data.push(updatedData);
			this.setState({ data }, () => typeof callback === "function" && callback());
		}
	};

	deleteData = callback => {
		const { data, editIdx } = this.state;

		if (editIdx > -1) {
			data.splice(editIdx, 1);
			this.setState({ data: data }, () => typeof callback === "function" && callback());
		}
	};

	point = new Animated.ValueXY();
	currentY = 0;
	scrollOffset = 0;
	flatlistTopOffset = 0;
	rowHeight = 0;
	currentIdx = -1;
	active = false;
	flatList = createRef();
	flatListHeight = 0;
	itemsHeight = {};

	constructor(props) {
		super(props);

		this._panResponder = PanResponder.create({
			// Ask to be the responder:
			onStartShouldSetPanResponder: (evt, gestureState) => true,
			onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
			onMoveShouldSetPanResponder: (evt, gestureState) => true,
			onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

			onPanResponderGrant: (evt, gestureState) => {
				// The gesture has started. Show visual feedback so the user knows
				// what is happening!
				// gestureState.d{x,y} will be set to zero now
				const orginPoint = gestureState.y0;
				this.currentIdx = this.yToIndex(orginPoint);
				this.currentY = gestureState.y0;

				Animated.event([{ y: this.point.y }])({
					y: orginPoint - this.rowHeight / 2 - navHeight
				});
				this.active = true;
				this.setState({ dragging: true, draggingIdx: this.currentIdx }, () => {
					this.animateList();
				});
			},
			onPanResponderMove: (evt, gestureState) => {
				const currentY = gestureState.moveY;
				this.currentY = currentY;

				Animated.event([{ y: this.point.y }])({
					y: currentY - navHeight * 1.5
				});
				// The most recent move distance is gestureState.move{X,Y}
				// The accumulated gesture distance since becoming responder is
				// gestureState.d{x,y}
			},
			onPanResponderTerminationRequest: (evt, gestureState) => false,
			onPanResponderRelease: (evt, gestureState) => {
				// The user has released all touches while this view is the
				// responder. This typically means a gesture has succeeded
				this.reset();
			},
			onPanResponderTerminate: (evt, gestureState) => {
				// Another component has become the responder, so this gesture
				// should be cancelled
				this.reset();
			},
			onShouldBlockNativeResponder: (evt, gestureState) => {
				// Returns whether this component should block native components from becoming the JS
				// responder. Returns true by default. Is currently only supported on android.
				return true;
			}
		});
	}

	componentDidMount() {
		this.props.navigation.setParams({
			saveChanges: this.saveChanges
		});
	}

	saveChanges = callback => {
		this.props.dispatch(saveFeatureChanges(this.state.data));

		typeof callback === "function" && callback();
	};

	animateList = () => {
		if (!this.active) {
			return;
		}

		requestAnimationFrame(() => {
			// check if we are near the bottom or top
			if (this.currentY + 100 > this.flatListHeight) {
				this.flatList.current.scrollToOffset({
					offset: this.scrollOffset + 10,
					animated: false
				});
			} else if (this.currentY < 100) {
				this.flatList.current.scrollToOffset({
					offset: this.scrollOffset - 10,
					animated: false
				});
			}

			// check y value see if we need to reorder
			const newIdx = this.yToIndex(this.currentY);
			if (this.currentIdx !== newIdx) {
				this.setState({
					data: immutableMove(this.state.data, this.currentIdx, newIdx),
					draggingIdx: newIdx
				});
				this.currentIdx = newIdx;
			}

			this.animateList();
		});
	};

	yToIndex = y => {
		// const value = Math.floor(
		//   (this.scrollOffset + y - this.flatlistTopOffset) / this.rowHeight
		// );

		let value = -1;
		const scroll_y = this.scrollOffset + y;
		const listLength = this.state.data.length;
		let accumulatedHeight = this.flatlistTopOffset;
		for (let i = 0; i < listLength; i++) {
			const itemHeight = this.itemsHeight[i];
			const newAccumulatedHeight = accumulatedHeight + itemHeight;
			if (scroll_y > accumulatedHeight && scroll_y < newAccumulatedHeight) {
				value = i;
				break;
			}
			accumulatedHeight = newAccumulatedHeight;
		}

		if (value < 0) {
			return 0;
		}

		if (value > this.state.data.length - 1) {
			return this.state.data.length - 1;
		}

		return value;
	};

	reset = () => {
		this.active = false;
		this.setState({ dragging: false, draggingIdx: -1 });
	};

	render() {
		const { data, dragging, draggingIdx } = this.state;

		const renderItem = ({ item, index }, noPanResponder = false) => {
			const {
				navTitle,
				title,
				navURL,
				icon,
				titleInfo,
				navigate,
				visible = true
			} = item;

			const navigationTitle = navTitle || title;
			const navProps = navURL ? {
				url: navURL,
				title: navigationTitle
			} : {};

			const imgSource = icon ? icons[icon] : icons["wifi"];
			return <View onLayout={e => {
				this.rowHeight = e.nativeEvent.layout.height;
				this.itemsHeight[index] = e.nativeEvent.layout.height;
			}} style={styles.a9f956890af6811ea88c25dbffc760ad0}>
				<Image style={styles.a9f956891af6811ea88c25dbffc760ad0} source={imgSource} />
				<View style={styles.a9f958fa0af6811ea88c25dbffc760ad0}>
					<Text>{title || ""}</Text>
					<Text style={styles.a9f958fa1af6811ea88c25dbffc760ad0}>{titleInfo || ""}</Text>
				</View>

				<View style={styles.a9f958fa2af6811ea88c25dbffc760ad0}>
					<TouchableHighlight onPress={() => {
						this.setState({
							modalVisible: true,
							editIdx: index,
							editNavURL: navURL,
							editIcon: icon ? icon : "wifi",
							editTitle: title,
							editTitleInfo: titleInfo,
							editVisible: visible
						});
					}}>
						<Text>Edit</Text>
					</TouchableHighlight>
				</View>
				<View style={styles.a9f958fa3af6811ea88c25dbffc760ad0}>
					<View {...noPanResponder ? {} : this._panResponder.panHandlers}>
						<FontAwesome name="sort" size={28} />
					</View>
				</View>
			</View>;
		};

		return <SafeAreaView style={styles.a9f958fa4af6811ea88c25dbffc760ad0}>
			<Overlay isVisible={this.state.modalVisible} windowBackgroundColor="rgba(0, 0, 0, .85)" height="90%">
				<ScrollView>
					<View>
						<Text style={styles.contactText}>
							Order:{" "}
							{this.state.editIdx > -1 ? this.state.editIdx + 1 : this.state.data.length + 1}{" "}
						</Text>
						<Text style={styles.contactText}>
							Select Icon: {this.state.editIcon}
						</Text>
						<View style={styles.a9f958fa5af6811ea88c25dbffc760ad0}>
							<RadioButton options={options} selected={this.state.editIcon} selectFunc={this.setEditIcon} />
						</View>

						<Text style={styles.contactText}>Title</Text>
						<TextInput onChangeText={text => this.setState({ editTitle: text })} placeholder={"Title"} value={this.state.editTitle} />

						<Text style={styles.contactText}>
							Title Info (Display on Right)
              </Text>
						<TextInput onChangeText={text => this.setState({ editTitleInfo: text })} placeholder={"Title Info"} value={this.state.editTitleInfo} />

						<Text style={styles.contactText}>URL</Text>
						<TextInput onChangeText={text => this.setState({ editNavURL: text })} placeholder={"URL"} value={this.state.editNavURL} />

						<Text style={styles.contactText}>Visible</Text>
						<Switch onValueChange={value => this.setState({ editVisible: value })} value={this.state.editVisible == false ? false : true} />

						<View style={styles.a9f95b6b0af6811ea88c25dbffc760ad0}>
							<Button title={this.state.editIdx > -1 ? "Update" : "Add"} onPress={() => this.updateData(() => this.setState({ modalVisible: false }))} />
						</View>

						{this.state.editIdx > -1 && <View style={styles.a9f95b6b1af6811ea88c25dbffc760ad0}>
							<Button title="Delete" onPress={() => this.deleteData(() => this.setState({ modalVisible: false }))} />
						</View>}

						<View style={styles.a9f95b6b2af6811ea88c25dbffc760ad0}>
							<Button title="Close" onPress={() => this.setState({ modalVisible: false })} />
						</View>
					</View>
				</ScrollView>
			</Overlay>

			<TouchableHighlight style={styles.addButton} underlayColor="#ff7043" onPress={() => {
				this.resetEditFields(() => this.setState({ modalVisible: true }));
			}}>
				<Text style={styles.a9f95ddc0af6811ea88c25dbffc760ad0}>
					+
          </Text>
			</TouchableHighlight>

			{dragging && <Animated.View style={styles.a9f95ddc1af6811ea88c25dbffc760ad0}>
				{renderItem({ item: data[draggingIdx], index: -1 }, true)}
			</Animated.View>}

			<View style={styles.a9f95ddc2af6811ea88c25dbffc760ad0}>
				<FlatList ref={this.flatList} ItemSeparatorComponent={this._flatListItemSeparator} scrollEnabled={!dragging} style={styles.a9f95ddc3af6811ea88c25dbffc760ad0} data={data} renderItem={renderItem} onScroll={e => {
					this.scrollOffset = e.nativeEvent.contentOffset.y;
				}} onLayout={e => {
					this.flatlistTopOffset = e.nativeEvent.layout.y + navHeight;
					this.flatListHeight = e.nativeEvent.layout.height;
				}} scrollEventThrottle={16} keyExtractor={item => "" + item} />
			</View>
		</SafeAreaView>;
	}
}

const styles = StyleSheet.create({
	a9f94cc50af6811ea88c25dbffc760ad0: {
		color: "#037AFF",
		alignSelf: "center",
		fontSize: 17,
		paddingBottom: 5,
		paddingRight: 20,
		fontWeight: "600"
	},
	a9f956890af6811ea88c25dbffc760ad0: {
		padding: 20,
		flexDirection: "row",
		alignItems: "center",
	},
	a9f956891af6811ea88c25dbffc760ad0: {
		alignSelf: "center",
		height: 30,
		width: 30
	},
	a9f958fa0af6811ea88c25dbffc760ad0: {
		paddingHorizontal: 12,
		flexDirection: "row",
		justifyContent: "space-between",
		flex: 1
	},
	a9f958fa1af6811ea88c25dbffc760ad0: {
		color: "grey"
	},
	a9f958fa2af6811ea88c25dbffc760ad0: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 10
	},
	a9f958fa3af6811ea88c25dbffc760ad0: {
		alignItems: "center",
		justifyContent: "center"
	},
	a9f958fa4af6811ea88c25dbffc760ad0: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center"
	},
	a9f958fa5af6811ea88c25dbffc760ad0: {
		width: 180,
		marginTop: 8
	},
	a9f95b6b0af6811ea88c25dbffc760ad0: {
		marginTop: 15
	},
	a9f95b6b1af6811ea88c25dbffc760ad0: {
		marginTop: 20
	},
	a9f95b6b2af6811ea88c25dbffc760ad0: {
		marginTop: 20
	},
	a9f95ddc0af6811ea88c25dbffc760ad0: {
		fontSize: 44,
		color: "white",
		position: "absolute",
		left: "23%",
		top: "-10%"
	},
	a9f95ddc1af6811ea88c25dbffc760ad0: {
		position: "absolute",
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: "grey",
		zIndex: 2,
		width: "100%",
	},
	a9f95ddc2af6811ea88c25dbffc760ad0: {
		height: "100%",
		width: "100%",
		borderColor: "black"
	},
	a9f95ddc3af6811ea88c25dbffc760ad0: {
		width: "100%"
	}
});

const mapStateToProps = state => ({
	settings: state.settings
});
export default connect(mapStateToProps)(ContactAdmin);