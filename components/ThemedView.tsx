import { View, type ViewProps } from "react-native";

import { Colors } from "../constants/Colors";


export function ThemedView({ style, ...otherProps }: ViewProps) {
	return <View style={[{ backgroundColor: Colors.background }, style]} {...otherProps} />;
}
