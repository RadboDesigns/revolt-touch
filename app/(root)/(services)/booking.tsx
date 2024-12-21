import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Image, Alert, TextInput } from 'react-native';
import { icons } from '@/constants';
import * as ImagePicker from 'expo-image-picker';
import { useSearchParams } from 'expo-router/build/hooks';
import { router } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import { Audio } from 'expo-av';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import { useUser } from "@clerk/clerk-expo";

interface RecordingLine {
  sound: Audio.Sound;
  duration: string;
  file: string;
}

interface FileObject {
  uri: string;
  type: string;
  name: string;
}

interface BookingDetails {
  amount: string;
  options: string[];
  description: string;
  images: FileObject[];
  recordings: FileObject[];
  email: string;  // Add this line
}

const BACKEND_URL = 'http://192.168.1.2:8000/';

export default function BookingPage() {
  const searchParams = useSearchParams();
  const totalAmount = searchParams.get('totalAmount') || '0';
  const selectedOptions = searchParams.get('selectedOptions') || '[]';
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    phone: "",
  });
  const options: string[] = JSON.parse(selectedOptions);

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [recordings, setRecordings] = useState<RecordingLine[]>([]);

  const fetchUserDetails = async () => {
    if (!profileData.email) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}api/profile/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profileData.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch user details');
      }

      const data = await response.json();
      setProfileData(prevData => ({
        ...prevData,
        ...data,
      }));
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to fetch user details'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [profileData.email]);


  // First, modify your handlePaymentSuccess function in booking.tsx:

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const formData = new FormData();
      
      // Add payment verification data
      formData.append('razorpay_payment_id', paymentData.razorpay_payment_id);
      formData.append('razorpay_order_id', paymentData.razorpay_order_id);
      formData.append('razorpay_signature', paymentData.razorpay_signature);
  
      // Create booking_details object with proper typing
      const bookingDetails: BookingDetails = {
        amount: totalAmount,
        options: options,
        description: description,
        images: [],
        recordings: [],
        email: profileData.email
      };
  
      // Add images if any
      if (imageUris.length > 0) {
        const imageFiles: FileObject[] = imageUris.map((uri, index) => ({
          uri,
          type: 'image/jpeg',
          name: `image-${index}.jpg`
        }));
        bookingDetails.images = imageFiles;
        
        // Append each image to formData
        imageFiles.forEach((file) => {
          formData.append('images', file as any);
        });
      }
  
      // Add recordings if any
      if (recordings.length > 0) {
        const audioFiles: FileObject[] = recordings.map((rec, index) => ({
          uri: rec.file,
          type: 'audio/m4a',
          name: `recording-${index}.m4a`
        }));
        bookingDetails.recordings = audioFiles;
        
        // Append each recording to formData
        audioFiles.forEach((file) => {
          formData.append('recordings', file as any);
        });
      }
  
      // Append booking details as JSON string
      formData.append('booking_details', JSON.stringify(bookingDetails));
  
      // Send data to backend
      const response = await axios.post(
        `${BACKEND_URL}api/order/complete/`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      if (response.status === 201) {
        Alert.alert(
          'Success', 
          'Booking confirmed successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.push('/servicess')
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to process booking'
      );
    }
  };

  const initiatePayment = async () => {
    if (!profileData.email) {
      Alert.alert('Error', 'Please complete your profile details first');
      return;
    }
  
    setIsLoading(true);
    try {
      // Add timeout to axios request
      const orderResponse = await axios.post(
        `${BACKEND_URL}api/order/create/`, 
        {
          amount: parseInt(totalAmount) * 100,
          currency: 'INR'
        },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
  
      if (!orderResponse.data?.data?.order_id) {
        throw new Error('Invalid order response');
      }
  
      const options = {
        description: 'Credits towards consultation',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: 'rzp_test_6DPEFbutV2mNls',
        order_id: orderResponse.data.data.order_id,
        amount: parseInt(totalAmount) * 100,
        name: 'Radbo Designs',
        prefill: {
          email: profileData.email,
          contact: profileData.phone,
          name: profileData.first_name
        },
        theme: { color: '#F37254' }
      };
  
      const paymentData = await RazorpayCheckout.open(options);
      await handlePaymentSuccess(paymentData);
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Error',
        error.response?.data?.message || 'Unable to initiate payment. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };


  // Recording functions remain the same
  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const { sound, status } = await recording.createNewLoadedSoundAsync();
      
      const duration = status.isLoaded ? getDurationFormatted(status.durationMillis) : '0:00';
      
      setRecordings(currentRecordings => [...currentRecordings, {
        sound: sound,
        duration: duration,
        file: recording.getURI() || ''
      }]);
      
      setRecording(undefined);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  }

  function getDurationFormatted(milliseconds: number): string {
    const minutes = milliseconds / 1000 / 60;
    const seconds = Math.round((minutes - Math.floor(minutes)) * 60);
    return seconds < 10 ? `${Math.floor(minutes)}:0${seconds}` : `${Math.floor(minutes)}:${seconds}`;
  }

  function getRecordingLines() {
    return recordings.map((recordingLine, index) => {
      return (
        <View key={index} style={styles.row}>
          <Text style={styles.recordingText}>
            Recording #{index + 1} | {recordingLine.duration}
          </Text>
          <Pressable 
            style={styles.playButton}
            onPress={() => recordingLine.sound.replayAsync()}
          >
            <Text style={styles.buttonText}>Play</Text>
          </Pressable>
        </View>
      );
    });
  }

  function clearRecordings() {
    setRecordings([])
  }



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
        
      </View>
      <View style={styles.container}>
      <Pressable 
        style={styles.recordButton} 
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {recording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </Pressable>
      {getRecordingLines()}
      {recordings.length > 0 && (
        <Pressable 
          style={styles.clearButton}
          onPress={clearRecordings}
        >
          <Text style={styles.buttonText}>Clear Recordings</Text>
        </Pressable>
      )}
      <View style={styles.container}>
        <CustomButton 
          title={isLoading ? "Processing..." : "Pay with Razorpay"} 
          onPress={initiatePayment} 
          disabled={isLoading}
          className="mt-6 bg-secondary-200" 
        />
      </View>
      </View>

      

    </ScrollView>
  );
      }

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    margin: 16,
  },
  recordingText: {
    flex: 1,
    margin: 16,
    color: '#FFFFFF', // White text for recording info
  },
  recordButton: {
    backgroundColor: '#FFD700', // Yellow color
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25, // Rounded edges
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  playButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
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
