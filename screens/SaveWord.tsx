import { useEffect, useState } from "react";
import { StyleSheet, ScrollView, RefreshControl, TextInput, Pressable, Alert, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import { FONT_FAMILY } from "../constants/Fonts";
import { Colors } from "../constants/Colors";
import { addWord, updateWord } from "../db/words";
import type { TabParamList } from "../navigation/types";


const EMPTY_WORD = {
    word: "",
    transliteration: "",
    translation: "",
};

export default function SaveWord() {
	const { t } = useTranslation();
    const { width, height } = useWindowDimensions();
    const route = useRoute<RouteProp<TabParamList, "explore">>();
    const navigation = useNavigation<BottomTabNavigationProp<TabParamList, "explore">>();

	const isLandscape = width > height;
	const screenWidth = isLandscape ? { width: Math.min(width * 0.94) } : null;

	const [refreshing, setRefreshing] = useState(false);
	const [saving, setSaving] = useState(false);
    const [newWord, setNewWord] = useState(EMPTY_WORD);
    /** Set while the form stands for a stored word, so Save rewrites it instead of adding one. */
    const [editingId, setEditingId] = useState<number | null>(null);

    const edit = route.params?.edit;

    useEffect(() => {
        if (!edit) return;

        setEditingId(edit.id);
        setNewWord({
            word: edit.word,
            transliteration: edit.transliteration,
            translation: edit.translation,
        });

        // Clear the request once it has been read, or coming back to this tab after the
        // form was cleared would silently drop the user into editing that word again.
        navigation.setParams({ edit: undefined });
    }, [edit, navigation]);

    const clearForm = () => {
        setNewWord(EMPTY_WORD);
        setEditingId(null);
    };

	const onRefresh = () => {
		setRefreshing(true);
        setTimeout(() => {
            clearForm();
			setRefreshing(false);
		}, 1000);
	};

    const saveWord = async () => {
        const word = {
            word: newWord.word.trim(),
            transliteration: newWord.transliteration.trim(),
            translation: newWord.translation.trim(),
        };

        if (word.word.length === 0 || word.translation.length === 0) {
            Alert.alert(t('The "Word" and "Translation" fields are required.'));
            return;
        }

        setSaving(true);
        try {
            if (editingId !== null) {
                const result = await updateWord(editingId, word);

                if (!result.updated) {
                    // The row is gone, so drop back to adding: the fields stay filled and
                    // another Save stores them as a new word.
                    if (result.reason === "missing") setEditingId(null);

                    Alert.alert(
                        result.reason === "missing"
                            ? t("That word is no longer in your dictionary.")
                            : t("This word is already in your dictionary."),
                    );
                    return;
                }
            } else {
                const { inserted } = await addWord(word);

                if (!inserted) {
                    Alert.alert(t("This word is already in your dictionary."));
                    return;
                }
            }

            clearForm();
        } catch (error) {
            console.error("Failed to save the word", error);
            Alert.alert(t("Could not save the word. Please try again."));
        } finally {
            setSaving(false);
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
            {editingId !== null && (
                <ThemedView style={styles.editBanner}>
                    <ThemedText type="semiBold">
                        {t("Edit")}
                    </ThemedText>
                    <Pressable onPress={clearForm}>
                        <ThemedText style={styles.cancelText}>
                            {t("Cancel")}
                        </ThemedText>
                    </Pressable>
                </ThemedView>
            )}

            <ThemedView>
                <ThemedText type="semiBold">
                    {t("Word")}:
                </ThemedText>
                <TextInput style={styles.input} value={newWord.word} onChangeText={(text) => setNewWord({...newWord, word: text})} />
            </ThemedView>

            <ThemedView style={styles.container}>
                <ThemedText type="semiBold">
                    {t("Transcription")}:
                </ThemedText>
                <TextInput style={styles.input} value={newWord.transliteration} onChangeText={(text) => setNewWord({...newWord, transliteration: text})} />
            </ThemedView>

            <ThemedView style={styles.container}>
                <ThemedText type="semiBold">
                    {t("Translation")}:
                </ThemedText>
                <TextInput style={styles.input} value={newWord.translation} onChangeText={(text) => setNewWord({...newWord, translation: text})} />
            </ThemedView>

            <Pressable style={styles.buttonContainer} onPress={saveWord} disabled={saving} >
                <ThemedText type="button">
                    {t("Save")}
                </ThemedText>
            </Pressable>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollView: {
        backgroundColor: Colors.background,
        width: "100%",
	},
    content: {
		paddingTop: 32,
		paddingBottom: 24,
	},
    container: {
		paddingTop: 30,
	},
    /** Only shown while editing — without it nothing says Save will overwrite a stored word. */
    editBanner: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingBottom: 20,
	},
    cancelText: {
		fontSize: 16,
		color: Colors.tint,
	},
    input: {
		backgroundColor: "#ffffff",
		marginLeft: 10,
		marginRight: 10,
		paddingLeft: 10,
		paddingRight: 10,
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
	buttonContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
        marginTop: 10
	},
});
