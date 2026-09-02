import { Text, type TextProps, StyleSheet } from "react-native";

import { Colors } from "../constants/Colors";


const FONT_FAMILY = "Open Sans"

export type ThemedTextProps = TextProps & {
	lightColor?: string;
	darkColor?: string;
	type?: "default" | "title" | "semiBold";
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
			type === "title" ? styles.title : undefined,
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
	title: {
		fontSize: 34,
		lineHeight: 32,
		fontFamily: FONT_FAMILY
	},
});
