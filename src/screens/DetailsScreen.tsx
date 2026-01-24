
import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

function DetailsScreen({ route }: Props) {
  const { userId } = route.params;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Details Screen</Text>
      <Text>User ID: {userId}</Text>
    </View>
  );
}

export default DetailsScreen;
