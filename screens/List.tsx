import { useCallback, useEffect, useState } from "react";
import { StyleSheet, ScrollView, RefreshControl, useWindowDimensions, TextInput, Pressable, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Share from "react-native-share";
import { errorCodes, isErrorWithCode, pick, types } from "@react-native-documents/picker";

import { Colors } from "../constants/Colors";
import { addWords, allWords, listWords, SortOrder, Word } from "../db/words";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import SortSelect from "../components/SortSelect";
import { FONT_FAMILY } from "../constants/Fonts";
import { CsvFormatError, csvToWords, wordsToCsv } from "../utils/csv";
import { utf8ToBase64 } from "../utils/base64";


const SEARCH_DEBOUNCE_MS = 250;

const SORT_STORAGE_KEY = "sort";
const DEFAULT_SORT: SortOrder = "old";

function isSortOrder(value: string | null): value is SortOrder {
	return value === "old" || value === "new";
}

export default function List() {
	const { t } = useTranslation();
	const { width, height } = useWindowDimensions();

	const isLandscape = width > height;
	const screenWidth = isLandscape ? { width: Math.min(width * 0.94) } : null;

	const [refreshing, setRefreshing] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [importing, setImporting] = useState(false);
	const [list, setList] = useState<Word[]>([]);
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortOrder | null>(null);

	const term = search.trim();
	const activeSort = sort ?? DEFAULT_SORT;

	useEffect(() => {
		(async () => {
			try {
				const stored = await AsyncStorage.getItem(SORT_STORAGE_KEY);
				setSort(isSortOrder(stored) ? stored : DEFAULT_SORT);
			} catch (error) {
				console.error("Failed to read the saved sort order", error);
				setSort(DEFAULT_SORT);
			}
		})();
	}, []);

	const getList = useCallback(
		async (isStale: () => boolean = () => false) => {
			if (!sort) return;

			try {
				const rows = await listWords({ search: term, sort });
				if (!isStale()) setList(rows);
			} catch (error) {
				console.error("Failed to load the word list", error);
			}
		},
		[term, sort],
	);

	useEffect(() => {
		let cancelled = false;
		const timer = setTimeout(() => getList(() => cancelled), term ? SEARCH_DEBOUNCE_MS : 0);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [term, getList]);

	const onRefresh = async () => {
		setRefreshing(true);
		await getList();
		setRefreshing(false);
        setSearch("");
	};

	const onSortChange = (next: SortOrder) => {
		setSort(next);
		AsyncStorage.setItem(SORT_STORAGE_KEY, next).catch((error) =>
			console.error("Failed to save the sort order", error),
		);
	};

    const exportList = async () => {
        setExporting(true);
        try {
            const words = await allWords();

            if (words.length === 0) {
                Alert.alert(t("There is nothing to export yet."));
                return;
            }

            await Share.open({
                filename: `dictionary-${new Date().toISOString().slice(0, 10)}`,
                url: `data:text/csv;base64,${utf8ToBase64(wordsToCsv(words))}`,
                type: "text/csv",
                useInternalStorage: true,
                failOnCancel: false,
            });
        } catch (error) {
            console.error("Failed to export the word list", error);
            Alert.alert(t("Could not export the word list. Please try again."));
        } finally {
            setExporting(false);
        }
    };

    const importList = async () => {
        setImporting(true);
        try {
            const [file] = await pick({ type: [...types.csv, types.plainText] });
            const text = await (await fetch(file.uri)).text();
            const { words, invalid } = csvToWords(text);

            if (words.length === 0) {
                Alert.alert(t("No words could be read from that file."));
                return;
            }

            const { inserted, skipped } = await addWords(words);
            await getList();

            Alert.alert(
                t("Imported {{inserted}}, skipped {{skipped}}.", {
                    inserted,
                    skipped: skipped + invalid,
                }),
            );
        } catch (error) {
            if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return;

            if (error instanceof CsvFormatError) {
                Alert.alert(t("That file does not look like a dictionary export."));
                return;
            }

            console.error("Failed to import the word list", error);
            Alert.alert(t("Could not import the word list. Please try again."));
        } finally {
            setImporting(false);
        }
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
			<ThemedView style={{ paddingTop: isLandscape ? 10 : 20 }}>
				<TextInput
					style={styles.input}
					value={search}
					onChangeText={setSearch}
					autoCapitalize="none"
					autoCorrect={false}
				/>

                <ThemedView style={isLandscape && styles.controlsRow}>
                    <ThemedView style={[styles.sortRow, isLandscape && styles.sortRowLandscape]}>
                        <SortSelect value={activeSort} onChange={onSortChange} />
                    </ThemedView>

                    <ThemedView
                        style={[styles.buttonContainer, isLandscape && styles.buttonContainerLandscape]}
                    >
                        <Pressable style={styles.button} onPress={exportList} disabled={exporting}>
                            <ThemedText>{t("Export")}</ThemedText>
                        </Pressable>
                        <Pressable style={styles.button} onPress={importList} disabled={importing}>
                            <ThemedText>{t("Import")}</ThemedText>
                        </Pressable>
                    </ThemedView>
                </ThemedView>
			</ThemedView>

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
    input: {
        backgroundColor: "#ffffff",
        marginLeft: 10,
        marginRight: 10,
        height: 40,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        fontFamily: FONT_FAMILY,
        fontSize: 18,
    },
    /** Landscape has the width to spare, so the sort and the buttons share one line. */
    controlsRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    sortRow: {
        alignItems: "flex-end",
        backgroundColor: "transparent",
        margin: 10,
        marginBottom: 0,
    },
    sortRowLandscape: {
        marginBottom: 10,
        marginRight: 0,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        margin: 10,
    },
    buttonContainerLandscape: {
        // Take the width left over by the sort so the buttons still spread out.
        flex: 1,
    },
    button: {
        fontSize: 14,
        textAlign: "center",
        backgroundColor: "darkgrey",
		padding: 5,
		alignItems: "center",
		borderRadius: 20,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
    },
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
