import { PropsWithChildren, useState } from "react";
import { StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";


export default function List() {
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
	scrollView: {
		paddingTop: 32,
	},
});
