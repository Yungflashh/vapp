
import { View, Text } from 'react-native';

function NativewindTestScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <Text className="text-2xl font-bold text-blue-500">Nativewind is working!</Text>
      <View className="mt-4 p-4 bg-white rounded-lg shadow-md">
        <Text className="text-lg text-gray-800">This is a styled component.</Text>
      </View>
    </View>
  );
}

export default NativewindTestScreen;
