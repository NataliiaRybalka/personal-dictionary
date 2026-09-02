import { useState, PropsWithChildren } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RadioButton } from "react-native-paper";

import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import i18n from "../i18n";

type Props = PropsWithChildren<{
	modalVisible: boolean;
	setModalVisible: (modalVisible: boolean) => void;
	setLanguage: (language: string) => void;
}>;

export default function ModalWindow({
	modalVisible,
	setModalVisible,
	setLanguage,
}: Props) {
	const [chosenLanguage, setChosenLanguage] = useState("ru");

	const storeData = async () => {
		setModalVisible(!modalVisible);
		await AsyncStorage.setItem("language", chosenLanguage);
		setLanguage(chosenLanguage);
		i18n.changeLanguage(chosenLanguage);
	};
	
	return (
		<Modal
			animationType="slide"
			transparent={true}
			visible={modalVisible}
			onRequestClose={() => setModalVisible(!modalVisible)}
		>
				<ThemedView style={styles.centeredView}>
					<ThemedView style={styles.modalView}>
						<RadioButton.Group
							onValueChange={(value) => setChosenLanguage(value)}
							value={chosenLanguage}
						>
							<ThemedView style={styles.radioView}>
								<RadioButton value="ru" color="black" />
								<ThemedText style={styles.radioText}>Русский</ThemedText>
							</ThemedView>
							<ThemedView style={styles.radioView}>
								<RadioButton value="en" color="black" />
								<ThemedText style={styles.radioText}>English</ThemedText>
							</ThemedView>
						</RadioButton.Group>

						<Pressable
							style={styles.button}
							onPress={storeData}
						>
							<ThemedText style={styles.buttonTextStyle}>{chosenLanguage === "ru" ? "Сохранить" : "Save"}</ThemedText>
						</Pressable>
					</ThemedView>
				</ThemedView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	centeredView: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	modalView: {
		margin: 20,
		backgroundColor: "#ffffff",
		borderRadius: 20,
		padding: 35,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	button: {
		borderRadius: 20,
		padding: 10,
		backgroundColor: "darkgrey",
		marginTop: 10,
		width: 200,
		shadowColor: "darkgrey",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	buttonTextStyle: {
		color: "white",
		textAlign: "center",
		fontSize: 24,
	},
	radioText: {
		fontSize: 20,
	},
	radioView: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "transparent",
	},
});
