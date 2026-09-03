import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, FlatList, RefreshControl, useWindowDimensions, TextInput, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Share from "react-native-share";
import { errorCodes, isErrorWithCode, pick, types } from "@react-native-documents/picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { Colors } from "../constants/Colors";
import { addWords, allWords, deleteWord, listWords, SortOrder, Word } from "../db/words";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import SortSelect from "../components/SortSelect";
import WordActions from "../components/WordActions";
import { FONT_FAMILY } from "../constants/Fonts";
import { CsvFormatError, csvToWords, wordsToCsv } from "../utils/csv";
import { utf8ToBase64 } from "../utils/base64";
import type { TabParamList } from "../navigation/types";


const SEARCH_DEBOUNCE_MS = 250;

/** How many words the list starts with, and how many more each scroll to the end adds. */
const PAGE_SIZE = 50;

/**
 * The Android sw600dp breakpoint — a shortest side of at least 600dp means a tablet rather
 * than a phone. Measured on the shortest side so turning the device never flips the verdict.
 */
const TABLET_MIN_SIDE = 600;

const SORT_STORAGE_KEY = "sort";
const DEFAULT_SORT: SortOrder = "old";

function isSortOrder(value: string | null): value is SortOrder {
	return value === "old" || value === "new";
}

export default function List() {
	const { t } = useTranslation();
	const { width, height } = useWindowDimensions();
	const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
	const insets = useSafeAreaInsets();

	const isLandscape = width > height;
	const isTablet = Math.min(width, height) >= TABLET_MIN_SIDE;
	/** Phone-sized rows read as cramped on a tablet, which has the room for larger text. */
	const cellText = isTablet ? styles.cellTablet : null;
	/**
	 * In landscape the system navigation bar sits on one side of a phone but stays at the
	 * bottom of a tablet, and which side it takes depends on the way the device was turned.
	 * The insets already carry all of that, so no orientation or device check is needed.
	 */
	const sideInsets = { paddingLeft: insets.left, paddingRight: insets.right };

	const [refreshing, setRefreshing] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [importing, setImporting] = useState(false);
	const [list, setList] = useState<Word[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortOrder | null>(null);
	const [selected, setSelected] = useState<Word | null>(null);

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

	/**
	 * Which load counts. Every call takes the next number, so a query still in flight when a
	 * newer one starts — a page asked for just before the term was retyped, a first page
	 * overtaken by a scroll — is dropped instead of landing on top of a newer list.
	 */
	const request = useRef(0);
	/** Set while a query is out, so one scroll to the end can't stack several of them. */
	const loading = useRef(false);

	/**
	 * Loads the first `count` words for the current term and sort. Each load re-reads the
	 * whole loaded prefix rather than fetching one page and appending it: it is one query
	 * either way, and it means a word added, edited or deleted in the meantime cannot shift
	 * the rows past an offset into a gap or a repeat. A full `count` rows back is the signal
	 * that there is likely more behind them — that is what lets the list ask for one page more.
	 */
	const load = useCallback(
		async (count: number) => {
			if (!sort) return;

			const id = ++request.current;
			loading.current = true;

			try {
				const rows = await listWords({ search: term, sort, limit: count });
				if (request.current !== id) return;

				setList(rows);
				setHasMore(rows.length === count);
			} catch (error) {
				console.error("Failed to load the word list", error);
			} finally {
				// Only the newest load owns the flag; an overtaken one must not clear it.
				if (request.current === id) loading.current = false;
			}
		},
		[term, sort],
	);

	// A new term or sort starts over from one page: whatever was scrolled through belonged
	// to the previous list.
	useEffect(() => {
		const timer = setTimeout(() => load(PAGE_SIZE), term ? SEARCH_DEBOUNCE_MS : 0);

		return () => clearTimeout(timer);
	}, [term, load]);

	/** Re-reads exactly what is on screen, so a reload keeps the pages already scrolled through. */
	const reloadLoaded = () => load(Math.max(PAGE_SIZE, list.length));

	/**
	 * One page more. An empty list means the first load is still the effect above's job —
	 * FlatList also calls this once when the content is shorter than the screen.
	 */
	const loadMore = () => {
		if (loading.current || !hasMore || list.length === 0) return;

		load(list.length + PAGE_SIZE);
	};

	// The other tab saves words into the same table while this screen stays mounted, so an
	// edit or a new word would otherwise only show up after a pull-to-refresh. Held in a ref
	// rather than listed as a dependency: it is rebuilt on every debounced search term and
	// on every loaded page, and a focus effect keyed on it would fire an extra query for each.
	const reload = useRef(reloadLoaded);

	useEffect(() => {
		reload.current = reloadLoaded;
	});

	useFocusEffect(
		useCallback(() => {
			reload.current();
		}, []),
	);

	const onRefresh = async () => {
		setRefreshing(true);
		await load(PAGE_SIZE);
		setRefreshing(false);
        setSearch("");
	};

	const onSortChange = (next: SortOrder) => {
		setSort(next);
		AsyncStorage.setItem(SORT_STORAGE_KEY, next).catch((error) =>
			console.error("Failed to save the sort order", error),
		);
	};

	const removeWord = async (id: number) => {
		try {
			await deleteWord(id);
			await reloadLoaded();
		} catch (error) {
			console.error("Failed to delete the word", error);
			Alert.alert(t("Could not delete the word. Please try again."));
		}
	};

	/** Close first, then ask: an Alert raised over an open Modal can end up behind it. */
	const onDelete = (word: Word) => {
		setSelected(null);
		Alert.alert(t("Are you sure?"), word.word, [
			{ text: t("Cancel"), style: "cancel" },
			{ text: t("Delete"), style: "destructive", onPress: () => removeWord(word.id) },
		]);
	};

	const onEdit = (word: Word) => {
		setSelected(null);
		navigation.navigate("explore", {
			edit: {
				id: word.id,
				word: word.word,
				transliteration: word.transliteration,
				translation: word.translation,
			},
		});
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
            await reloadLoaded();

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
		<ThemedView style={styles.screen}>
			{/* A FlatList, not a ScrollView: only the rows near the viewport are mounted, so a
                dictionary of thousands stays scrollable, and reaching the end pulls the next
			    page in. The search, the controls and the table head ride along as its header. */}
			<FlatList
				style={styles.list}
				contentContainerStyle={[styles.content, sideInsets]}
				data={list}
				keyExtractor={(word) => String(word.id)}
				renderItem={({ item }) => (
					<Pressable
						style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
						onLongPress={() => setSelected(item)}
					>
						<ThemedText style={[styles.cell, cellText]}>{item.translation}</ThemedText>
						<ThemedText style={[styles.cell, styles.middleCell, cellText]}>
							{item.transliteration}
						</ThemedText>
						<ThemedText style={[styles.cell, cellText]}>{item.word}</ThemedText>
					</Pressable>
				)}
				ListHeaderComponent={
					<>
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

						<ThemedView style={[styles.row, styles.headerRow]}>
							<ThemedText type="semiBold" style={[styles.cell, styles.headerCell, cellText]}>
								{t("Translation")}
							</ThemedText>
							<ThemedText
								type="semiBold"
								style={[styles.cell, styles.headerCell, styles.middleCell, cellText]}
							>
								{t("Transcription")}
							</ThemedText>
							<ThemedText type="semiBold" style={[styles.cell, styles.headerCell, cellText]}>
								{t("Word")}
							</ThemedText>
						</ThemedView>
					</>
				}
				ListFooterComponent={<ThemedView style={styles.tableEnd} />}
				onEndReached={loadMore}
				onEndReachedThreshold={0.5}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
			/>

			<WordActions
				word={selected}
				onDelete={onDelete}
				onEdit={onEdit}
				onClose={() => setSelected(null)}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	list: {
		flex: 1,
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
	/** Closes the table off at the bottom, where the old wrapper's margin did. */
	tableEnd: {
		height: 30,
	},
	row: {
		flexDirection: "row",
		alignItems: "stretch",
		// The table's white background: every row is a list cell of its own now, rather than
		// a child of one wrapper that carried it.
		backgroundColor: "#ffffff",
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#c0c4c8",
	},
	/** The only hint that a row does something — a long press opens the Delete / Edit sheet. */
	rowPressed: {
		backgroundColor: "#eceff1",
	},
	headerRow: {
		// The gap under the controls that the old table wrapper's top margin left.
		marginTop: 10,
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
    /** Scaled together so the rows stay proportional, not just taller. */
    cellTablet: {
        fontSize: 22,
        lineHeight: 30,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 12,
        paddingRight: 12,
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
