import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Image, Alert, TextInput } from 'react-native';
import { icons } from '@/constants';
import * as ImagePicker from 'expo-image-picker';
import { useSearchParams } from 'expo-router/build/hooks';
import { router } from 'expo-router';
import CustomButton from '@/components/CustomButton';

export default function BookingPage() {
  const searchParams = useSearchParams();
  const totalAmount = searchParams.get('totalAmount') || '0'; // Get 'totalAmount' from URL
  const selectedOptions = searchParams.get('selectedOptions') || '[]'; // Get 'selectedOptions' from URL
  const options: string[] = JSON.parse(selectedOptions); // Parse selected options

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');

  const handlePaymentSuccess = () => {
    saveBookingToDatabase({
      options,
      totalAmount: Number(totalAmount),
    });
    router.push('/(root)/(tabs)/orders');
  };

  const saveBookingToDatabase = (bookingDetails: { options: string[]; totalAmount: number }) => {
    // Save booking details to Neon Postgres DB
    console.log('Saving to DB:', bookingDetails);
  };

  const handleImagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'You need to grant access to the gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets?.map((asset) => asset.uri) || [];
      setImageUris([...imageUris, ...selectedImages]);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'black' }} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Header */}
      <View className="flex-row items-center justify-center mt-5">
        <Pressable
          className="absolute left-5"
          onPress={() => router.push(`/servicess`)} >
          <Image
            source={icons.backArrow}
            style={{
              width: 24,
              height: 24,
              tintColor: 'white',
            }}
          />
        </Pressable>
        <Text className="text-white-100 font-pregular text-2xl">Booking</Text>
      </View>

      {/* Booking Summary */}
      <View style={styles.container}>
        <ScrollView>
          <Text className='text-xl font-pregular text-white-100 mt-5 mb-10'>Your Booking Summary:</Text>
          {options.map((option: string, index: number) => (
            <Text key={index} className='text-2xl font-pregular text-secondary-200 md-5'>
              * {option}
            </Text>
          ))}
          <Text style={styles.total}>Total Amount:  
          <Text className='text-secondary-200 font-pregular'>₹ {totalAmount}</Text></Text>
        </ScrollView>
        
      </View>

      {/* Add reference Image */}
      <View style={styles.section}>
        <Text className='text-white-200 font-pregular text-lg mb-5'>Add reference Image</Text>
        <Pressable style={styles.imageBox} onPress={handleImagePick}>
          <Text style={styles.addIcon}>+</Text>
        </Pressable>
        <View style={styles.imageRow}>
          {imageUris.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.imageInRow} />
          ))}
        </View>
      </View>

      {/* Description Box */}
      <View style={styles.section}>
        <Text className='text-white-200 font-pregular text-lg mb-5'>Description</Text>
        <TextInput
          style={styles.textInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Write your thoughts here..."
          placeholderTextColor="#E2E8F0"
          multiline
        />
        <CustomButton title="Proceed to Pay" onPress={handlePaymentSuccess} className="mt-6 bg-secondary-200" />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  backArrow: {
    position: 'absolute',
    left: 20,
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'Poppins-Regular',
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    marginBottom: 10,
  },
  selectedOptionsContainer: {
    marginBottom: 20,
  },
  selectedOption: {
    color: '#E2E8F0',
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    marginBottom: 5,
  },
  imageBox: {
    width: 88,
    height: 88,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#1A202C',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  addIcon: {
    color: '#E2E8F0',
    fontSize: 40,
  },
  textInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#1A202C',
    color: '#E2E8F0',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  imageRow: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  imageInRow: {
    width: 80,
    height: 80,
    margin: 4,
    borderRadius: 8,
  },
  bar: {
    width: '100%',
    height: 64,
    backgroundColor: '#2D3748',
    borderRadius: 8,
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  leftSide: {
    flex: 1,
  },
  rightSide: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  totalAmountText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
  },
  button: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#1A202C',
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
  },
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: 'black',
    },
    
    subHeader: {
      fontSize: 18,
      color: 'white',
      marginBottom: 10,
    },
    total: {
      fontSize: 20,
      color: 'white',
      fontWeight: 'bold',
      marginTop: 20,
    },
    payButton: {
      backgroundColor: '#E2E8F0',
      padding: 15,
      alignItems: 'center',
      borderRadius: 8,
      marginTop: 30,
    },
    payButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'black',
    },
  
});