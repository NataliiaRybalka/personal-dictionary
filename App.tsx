import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
	NavigationContainer,
	DarkTheme,
	DefaultTheme,
	createNavigationContainerRef,
} from '@react-navigation/native';
import BootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import RootNavigator from './navigation/RootNavigator';
import i18n from './i18n';


const navigationRef = createNavigationContainerRef();

export default function App() {

	useEffect(() => {
		(async () => {
			const language = await AsyncStorage.getItem('language');
			if (language) await i18n.changeLanguage(language);
		})();
	}, []);

	return (
        <SafeAreaProvider>
            <StatusBar barStyle='light-content' />
            <NavigationContainer
                ref={navigationRef}
                theme={DefaultTheme}
                onReady={() => BootSplash.hide({ fade: true })}
            >
                <RootNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
	);
}
