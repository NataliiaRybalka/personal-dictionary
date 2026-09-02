import { useEffect, useState } from "react";
import { StyleSheet, ScrollView, RefreshControl, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";

import { Colors } from "../constants/Colors";
import { listWords, Word } from "../db/words";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";


export default function List() {
	const { t } = useTranslation();
	const { width, height } = useWindowDimensions();

	const isLandscape = width > height;
	const screenWidth = isLandscape ? { width: Math.min(width * 0.94) } : null;

	const [refreshing, setRefreshing] = useState(false);
	const [list, setList] = useState<Word[]>([]);

	useEffect(() => {
		getList();
	}, []);

	const getList = async () => {
		try {
			setList(await listWords());
		} catch (error) {
			console.error("Failed to load the word list", error);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await getList();
		setRefreshing(false);
	};

	return (
		<ScrollView
			style={[styles.scrollView, screenWidth]}
			contentContainerStyle={styles.content}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
				/>
			}
		>
			<ThemedView style={styles.topContainer} />

			<ThemedView style={[styles.table]}>
				<ThemedView style={[styles.row, styles.headerRow]}>
					<ThemedText type="semiBold" style={[styles.cell, styles.headerCell]}>
						{t("Translation")}
					</ThemedText>
					<ThemedText type="semiBold" style={[styles.cell, styles.headerCell, styles.middleCell]}>
						{t("Transcription")}
					</ThemedText>
					<ThemedText type="semiBold" style={[styles.cell, styles.headerCell]}>
						{t("Word")}
					</ThemedText>
				</ThemedView>

				{list.map((word) => (
					<ThemedView key={word.id} style={styles.row}>
						<ThemedText style={styles.cell}>{word.translation}</ThemedText>
						<ThemedText style={[styles.cell, styles.middleCell]}>
							{word.transliteration}
						</ThemedText>
						<ThemedText style={styles.cell}>{word.word}</ThemedText>
					</ThemedView>
				))}
			</ThemedView>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: Colors.background,
	},
    content: {
		paddingTop: 32,
		paddingBottom: 24,
	},
	topContainer: {},
	table: {
		marginTop: 10,
		marginBottom: 30,
		backgroundColor: "#ffffff",
		overflow: "hidden",
	},
	row: {
		flexDirection: "row",
		alignItems: "stretch",
		backgroundColor: "transparent",
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#c0c4c8",
	},
	headerRow: {
		backgroundColor: "#cfd4d8",
		borderBottomWidth: 1,
		borderBottomColor: Colors.icon,
	},
	cell: {
		flex: 1,
		fontSize: 16,
		lineHeight: 22,
		textAlign: "left",
		paddingTop: 8,
		paddingBottom: 8,
		paddingLeft: 8,
		paddingRight: 8,
	},
    headerCell: {
        textAlign: "center",
    },
	middleCell: {
		borderLeftWidth: StyleSheet.hairlineWidth,
		borderRightWidth: StyleSheet.hairlineWidth,
		borderColor: "#c0c4c8",
	},
});
