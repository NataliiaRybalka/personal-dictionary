import { useEffect, useRef, useState } from "react";
import {
	Modal,
	Pressable,
	StyleSheet,
	View,
	useWindowDimensions,
	type PressableInstance,
} from "react-native";
import { useTranslation } from "react-i18next";
import Feather from "react-native-vector-icons/Feather";

import { ThemedText } from "./ThemedText";
import { Colors } from "../constants/Colors";
import { SortOrder } from "../db/words";

const OPTIONS: SortOrder[] = ["old", "new"];

/** Where the open list is drawn: right under the title, aligned with its left edge. */
type Anchor = { top: number; left: number; minWidth: number };

type Props = {
	value: SortOrder;
	onChange: (value: SortOrder) => void;
};

/**
 * Tapping the title opens the options. The list is drawn in a Modal rather than
 * absolutely inside the screen, so it lies over the table below instead of being clipped
 * by the ScrollView, and a tap anywhere outside closes it. That costs one measurement of
 * the title to place it.
 */
export default function SortSelect({ value, onChange }: Props) {
	const { t } = useTranslation();
	const { width, height } = useWindowDimensions();

	const title = useRef<PressableInstance>(null);
	const [anchor, setAnchor] = useState<Anchor | null>(null);

	const close = () => setAnchor(null);

	// A measured position goes stale on rotation, so close instead of leaving the list
	// somewhere it doesn't belong.
	useEffect(close, [width, height]);

	const open = () => {
		title.current?.measureInWindow((x, y, w, h) =>
			setAnchor({ top: y + h, left: x, minWidth: w }),
		);
	};

	const select = (option: SortOrder) => {
		close();
		if (option !== value) onChange(option);
	};

	const label = (option: SortOrder) =>
		option === "old" ? `${t("old")} → ${t("new")}` : `${t("new")} → ${t("old")}`;

	return (
		<>
			<Pressable ref={title} style={styles.title} onPress={open}>
				<ThemedText type="semiBold" style={styles.titleText}>
					{t("Sort")}:
				</ThemedText>
				<ThemedText style={styles.valueText}>{label(value)}</ThemedText>
				<Feather name="chevron-down" size={20} color={Colors.icon} />
			</Pressable>

			<Modal
				transparent
				// The measured position is in window coordinates, so the list has to be
				// placed in that same space — including the area behind the status bar.
				statusBarTranslucent
				visible={anchor !== null}
				animationType="fade"
				onRequestClose={close}
			>
				<Pressable style={styles.backdrop} onPress={close} />

				{anchor !== null && (
					<View style={[styles.list, anchor]}>
						{OPTIONS.map((option, index) => (
							<Pressable
								key={option}
								style={[
									styles.option,
									index > 0 && styles.divider,
									option === value && styles.optionSelected,
								]}
								onPress={() => select(option)}
							>
								<ThemedText style={styles.optionText}>{label(option)}</ThemedText>
							</Pressable>
						))}
					</View>
				)}
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	title: {
		flexDirection: "row",
		alignItems: "center",
		height: 40,
	},
	titleText: {
		paddingLeft: 0,
		paddingRight: 6,
	},
	valueText: {
		paddingLeft: 0,
		paddingRight: 4,
		fontSize: 16,
		textAlign: "left",
	},
	backdrop: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	list: {
		position: "absolute",
		backgroundColor: "#ffffff",
		borderRadius: 10,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 8,
	},
	option: {
		height: 40,
		justifyContent: "center",
		paddingLeft: 10,
		paddingRight: 10,
	},
	optionSelected: {
		backgroundColor: "#cfd4d8",
	},
	divider: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "#c0c4c8",
	},
	optionText: {
		paddingLeft: 0,
		paddingRight: 0,
		fontSize: 16,
		textAlign: "left",
	},
});
