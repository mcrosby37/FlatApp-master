import firebase from "../lib/firebase";
import moment from "moment";
import I18n from "../lib/i18n";
import { getLanguageString } from "../lib/global";

export function getCalendarItems(domain: string, language: string, callback: any) {
	const todayDay = new moment().format("MMMM Do");
	const todayItem = {};
	const todayDate = moment().format("YYYY-MM-DD");

	todayItem[todayDate] = [];
	todayItem[todayDate].push({
		_key: "todayKey",
		summary: I18n.t("today") + " " + todayDay,
		summaryMyLanguage: I18n.t("today") + " " + todayDay,
		icon: "md-radio-button-off",
		color: "yellow",
		title: todayDay,
		marginBottom: 25,
	});
	callback(todayItem);

	const timeToString = (time) => {
		const date = new Date(time);
		return date.toISOString().split("T")[0];
	};

	var today = new Date();
	var rangeStart = today.setDate(-30);

	const unsubscribe = firebase
		.firestore()
		.collection(domain)
		.doc("calendar")
		.collection("calendarItems")
		.where("timestamp", ">=", new Date(rangeStart))
		.onSnapshot(function (snapshot) {
			var items2 = {};
			var newItems = {};
			var trans = {};
			var strtime = 0;

			for (let i = -15; i < 365; i++) {
				const time = Date.now() + i * 24 * 60 * 60 * 1000;
				const strtime2 = timeToString(time);
				newItems[strtime2] = [];
			}

			items2 = newItems;
			const todayDay = new moment().format("MMMM Do");

			items2[todayDate].push({
				_key: "todayKey",
				summary: I18n.t("today") + " " + todayDay,
				summaryMyLanguage: I18n.t("today") + " " + todayDay,
				icon: "md-radio-button-off",
				color: "yellow",
				title: todayDay,
			});

			snapshot.forEach((doc) => {
				strtime = doc.data().date_start;
				strtime = strtime.substring(0, 10);

				if (!items2[strtime]) {
					items2[strtime] = [];
				}

				trans = {
					source: "calendar",
					summaryMyLanguage: doc.data().summary,
					descriptionMyLanguage: doc.data().description,
					color: doc.data().color,
				};

				var event = { ...{ _key: doc.id }, ...doc.data(), ...trans };
				items2[strtime].push(event);
			});

			callback(items2);
		});

	return () => unsubscribe();
}

export function getCalendarToday(domain: string, language: string, callback: any) {
	const todayDate = moment().format("YYYY-MM-DD");

	var calendarItems = [];

	const unsubscribe = firebase
		.firestore()
		.collection(domain)
		.doc("calendar")
		.collection("calendarItems")
		.where("date_start", "==", todayDate)
		.onSnapshot(function (snapshot) {
			snapshot.forEach((doc) => {
				var trans = {
					visible: true,
					source: "calendar",
					summaryMyLanguage: getLanguageString(language, doc.data(), "summary"),
					summary: doc.data().summary,
					summaryEN: doc.data().summary,
					date_start: doc.data().date_start,
					color: "red",
					showIconChat: false,
					descriptionMyLanguage: getLanguageString(language, doc.data(), "description"),
					number: doc.data().number,
				};
				calendarItems.push({
					...{ _key: doc.id },
					...doc.data(),
					...trans,
				});
			});
			callback(calendarItems);
		});

	return () => unsubscribe();
}
