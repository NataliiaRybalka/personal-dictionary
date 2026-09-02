import { Text, type TextProps, StyleSheet } from "react-native";

import { Colors } from "../constants/Colors";
import { FONT_FAMILY } from "../constants/Fonts";


export type ThemedTextProps = TextProps & {
	lightColor?: string;
	darkColor?: string;
	type?: "default" | "button" | "semiBold";
};

export function ThemedText({
	style,
	lightColor,
	darkColor,
	type = "default",
	...rest
	}: ThemedTextProps) {
	const color = Colors.text;

	return (
		<Text
		style={[
			{ color },
			type === "default" ? styles.default : undefined,
			type === "button" ? styles.button : undefined,
			type === "semiBold" ? styles.semiBold : undefined,
			style,
		]}
		{...rest}
		/>
	);
}

const styles = StyleSheet.create({
	default: {
		fontSize: 18,
		lineHeight: 24,
		textAlign: "justify",
		paddingLeft: 10,
		paddingRight: 10,
		fontFamily: FONT_FAMILY,
	},
	semiBold: {
		fontSize: 18,
		lineHeight: 24,
		fontWeight: "600",
		paddingLeft: 10,
		paddingRight: 10,
		fontFamily: FONT_FAMILY
	},
	button: {
		fontSize: 22,
		fontFamily: FONT_FAMILY,
        textAlign: "center",
        backgroundColor: "darkgrey",
		marginTop: 10,
		marginBottom: 10,
		padding: 10,
		alignItems: "center",
		width: 200,
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
});
