import { Text, type TextProps, StyleSheet } from 'react-native';

import { Colors } from '../constants/Colors';

export type ThemedTextProps = TextProps & {
	lightColor?: string;
	darkColor?: string;
	type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'settings';
};

export function ThemedText({
	style,
	lightColor,
	darkColor,
	type = 'default',
	...rest
	}: ThemedTextProps) {
	const color = Colors.text;

	return (
		<Text
		style={[
			{ color },
			type === 'default' ? styles.default : undefined,
			type === 'title' ? styles.title : undefined,
			type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
			type === 'subtitle' ? styles.subtitle : undefined,
			type === 'link' ? styles.link : undefined,
			type === 'settings' ? styles.settings : undefined,
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
		textAlign: 'justify',
		paddingLeft: 10,
		paddingRight: 10,
		fontFamily: 'Open Sans'
	},
	defaultSemiBold: {
		fontSize: 18,
		lineHeight: 24,
		fontWeight: '600',
		paddingLeft: 10,
		paddingRight: 10,
		fontFamily: 'Open Sans'
	},
	title: {
		fontSize: 34,
		lineHeight: 32,
		fontFamily: 'Forum'
	},
	subtitle: {
		fontSize: 20,
		fontWeight: 'bold',
		fontFamily: 'Open Sans'
	},
	link: {
		lineHeight: 30,
		fontSize: 16,
		color: '#0a7ea4',
		fontFamily: 'Open Sans'
	},
	settings: {
		fontSize: 24,
		lineHeight: 24,
		fontWeight: '600',
		fontFamily: 'Open Sans'
	},
});
