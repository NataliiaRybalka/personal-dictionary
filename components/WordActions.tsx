import { Modal, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Word } from "../db/words";

type Props = {
	/** The long-pressed word, or null when nothing is selected — which also closes the modal. */
	word: Word | null;
	onDelete: (word: Word) => void;
	onEdit: (word: Word) => void;
	onClose: () => void;
};

/**
 * The Delete / Edit sheet a long press on a row opens. The backdrop sits under a
 * box-none container, so a tap on the card reaches the buttons while a tap anywhere
 * around it falls through to the backdrop and closes.
 */
export default function WordActions({ word, onDelete, onEdit, onClose }: Props) {
	const { t } = useTranslation();

	return (
		<Modal
			transparent
			animationType="fade"
			visible={word !== null}
			onRequestClose={onClose}
		>
			<Pressable style={styles.backdrop} onPress={onClose} />

			<ThemedView style={styles.centeredView} pointerEvents="box-none">
				{word !== null && (
					<ThemedView style={styles.card}>
						<ThemedText type="semiBold" style={styles.cardTitle} numberOfLines={2}>
							{word.word}
						</ThemedText>

						<Pressable
							style={[styles.button, styles.deleteButton]}
							onPress={() => onDelete(word)}
						>
							<ThemedText style={styles.buttonText}>{t("Delete")}</ThemedText>
						</Pressable>

						<Pressable style={styles.button} onPress={() => onEdit(word)}>
							<ThemedText style={styles.buttonText}>{t("Edit")}</ThemedText>
						</Pressable>

						<Pressable style={styles.cancelButton} onPress={onClose}>
							<ThemedText style={styles.cancelText}>{t("Cancel")}</ThemedText>
						</Pressable>
					</ThemedView>
				)}
			</ThemedView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0.35)",
	},
	centeredView: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "transparent",
	},
	card: {
		margin: 20,
		backgroundColor: "#ffffff",
		borderRadius: 20,
		paddingTop: 20,
		paddingBottom: 20,
		paddingLeft: 25,
		paddingRight: 25,
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
	cardTitle: {
		maxWidth: 240,
		marginBottom: 10,
		textAlign: "center",
	},
	button: {
		borderRadius: 20,
		padding: 10,
		marginTop: 10,
		width: 200,
		backgroundColor: "darkgrey",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	deleteButton: {
		backgroundColor: "#e31d28",
	},
	buttonText: {
		color: "#ffffff",
		fontSize: 22,
		textAlign: "center",
	},
	cancelButton: {
		padding: 10,
		marginTop: 10,
		width: 200,
	},
	cancelText: {
		fontSize: 18,
		textAlign: "center",
	},
});
