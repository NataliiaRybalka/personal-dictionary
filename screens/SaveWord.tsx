import { PropsWithChildren, useState } from "react";
import { StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";


type Props = PropsWithChildren<{
	language: string;
}>;

export default function SaveWord({ language }: Props) {
	const { t } = useTranslation();

	const [refreshing, setRefreshing] = useState(false);

	const onRefresh = () => {
		setRefreshing(true);
	};

	return (
		<ScrollView
			style={styles.scrollView}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
				/>
			}
		>
			
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingTop: 30,
	},
	stepContainer: {
		gap: 8,
		marginBottom: 8,
		padding: 10,
	},
	scrollView: {
		paddingTop: 32,
	},
});
