import { Image, View, Text, Alert, Platform } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import CustomButton from '@/components/CustomButton';

const YourDesign = () => {
  // Get the preview image and ensure it's a single string
  const params = useLocalSearchParams();
  const previewImage = Array.isArray(params.previewImage) 
    ? params.previewImage[0] 
    : params.previewImage;

  const downloadImage = async () => {
    if (!previewImage) {
      Alert.alert('Error', 'No image available to download');
      return;
    }

    try {
      // Request permissions (Android only)
      if (Platform.OS === 'android') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant permission to save images');
          return;
        }
      }

      // Create a local file URL for the image
      const fileUri = FileSystem.documentDirectory + "design.jpg";
      
      // Download the image
      const { uri } = await FileSystem.downloadAsync(
        previewImage,
        fileUri
      );

      // Save to device gallery
      if (Platform.OS === 'android') {
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('Downloads', asset, false);
      } else {
        // For iOS, save directly to camera roll
        await MediaLibrary.saveToLibraryAsync(uri);
      }

      Alert.alert('Success', 'Image downloaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download image');
      console.error(error);
    }
  };

  const handleUpdate = () => {
    if (!previewImage) {
      Alert.alert('Error', 'No image available to update');
      return;
    }

    router.push({
      pathname: '/update',
      params: {
        previewImage: previewImage
      }
    });
  };

  if (!previewImage) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">No image available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 p-4">
        {/* Preview Image */}
        <View className="flex-1 justify-center items-center mb-6">
          <Image
            source={{ uri: previewImage }}
            className="w-full h-3/4"
            resizeMode="contain"
          />
        </View>

        {/* Buttons Container */}
        <View className="flex-row justify-center space-x-4 mb-8">
          <CustomButton
            title="Download"
            onPress={downloadImage}
            className="flex-1 bg-secondary-200"
          />
          <CustomButton
            title="Update"
            onPress={handleUpdate}
            className="flex-1 bg-secondary-200"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default YourDesign;