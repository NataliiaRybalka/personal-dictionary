import { Platform } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export function HapticTab(props: BottomTabBarButtonProps) {
	return (
		<PlatformPressable
			{...props}
				onPressIn={(ev) => {
					if (Platform.OS === 'ios') {
						ReactNativeHapticFeedback.trigger('impactLight', {
							enableVibrateFallback: false,
							ignoreAndroidSystemSettings: false,
						});
					}
					props.onPressIn?.(ev);
				}
			}
		/>
	);
}
