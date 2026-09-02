import React, { useState, useEffect } from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Feather from "react-native-vector-icons/Feather";

import { HapticTab } from "../components/HapticTab";
import TabBarBackground from "../components/ui/TabBarBackground";
import { Colors } from "../constants/Colors";
import ModalWindow from "../components/Modal";
import i18n from "../i18n";

import SaveWord from "../screens/SaveWord";
import List from "../screens/List";


const Tab = createBottomTabNavigator();

export default function TabNavigator() {
	const [language, setLanguage] = useState("");
	const [modalVisible, setModalVisible] = useState(false);

	const getStorageData = async () => {
		const value = await AsyncStorage.getItem("language");
		if (value !== null) {
			setLanguage(value);
			i18n.changeLanguage(value);
		}
		else {
			setModalVisible(true);
			i18n.changeLanguage("en");
		}
	};

	useEffect(() => {
		getStorageData();
	}, []);

	return (
		<Tab.Navigator
			screenOptions={{
				tabBarActiveTintColor: Colors.tint,
				tabBarLabelStyle: {
                    fontFamily: "Open Sans",
					fontSize: 14,
				},
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
				ios: {
					position: "absolute",
				},
				default: {},
				}),
			}}
		>
			<Tab.Screen
				name="index"
				options={{
                    title: language === "ru" ? "Список слов" : "Word List",
                    tabBarIcon: () => <Feather name="list" size={24} color="black" />,
				}}
			>
				{() => !language
				? <ModalWindow
					modalVisible={modalVisible}
					setModalVisible={setModalVisible}
					setLanguage={setLanguage}
				/>
				: <List
					language={language}
				/>}
			</Tab.Screen>
			<Tab.Screen
				name="explore"
				options={{
					title: language === "ru" ? "Новое слово" : "New word",
					tabBarIcon: () => <Feather name="edit" size={24} color="black" />,
				}}
			>
				{() => <SaveWord language={language} />}
			</Tab.Screen>
		</Tab.Navigator>
	);
}
