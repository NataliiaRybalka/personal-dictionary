import { useState } from "react";
import { StyleSheet, ScrollView, RefreshControl, TextInput, Pressable, Alert, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import { FONT_FAMILY } from "../constants/Fonts";
import { Colors } from "../constants/Colors";
import { addWord } from "../db/words";


export default function SaveWord() {
	const { t } = useTranslation();
    const { width, height } = useWindowDimensions();

	const isLandscape = width > height;
	const screenWidth = isLandscape ? { width: Math.min(width * 0.94) } : null;

	const [refreshing, setRefreshing] = useState(false);
	const [saving, setSaving] = useState(false);
    const [newWord, setNewWord] = useState({
        word: "",
        transliteration: "",
        translation: "",
    });

	const onRefresh = () => {
		setRefreshing(true);
        setTimeout(() => {
			setNewWord({
                word: "",
                transliteration: "",
                translation: "",
            });
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
            const { inserted } = await addWord(word);

            if (!inserted) {
                Alert.alert(t("This word is already in your dictionary."));
                return;
            }

            setNewWord({
                word: "",
                transliteration: "",
                translation: "",
            });
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
