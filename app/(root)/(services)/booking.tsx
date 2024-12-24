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

interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
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

  const handlePaymentSuccess = async (paymentData: PaymentResponse, bookingDetails: BookingDetails) => {
    try {
      const formData = new FormData();
      
      // Add payment verification data
      formData.append('razorpay_payment_id', paymentData.razorpay_payment_id);
      formData.append('razorpay_order_id', paymentData.razorpay_order_id);
      formData.append('razorpay_signature', paymentData.razorpay_signature);
  
      // Process images if any
      if (bookingDetails.images.length > 0) {
        for (let i = 0; i < bookingDetails.images.length; i++) {
          const image = bookingDetails.images[i];
          // Add specific file extension and proper MIME type
          const fileExtension = image.uri.split('.').pop() || 'jpg';
          formData.append('images', {
            uri: image.uri,
            type: `image/${fileExtension}`,
            name: `image-${i}.${fileExtension}`
          } as any);
        }
      }
  
      // Process recordings if any
      if (bookingDetails.recordings.length > 0) {
        for (let i = 0; i < bookingDetails.recordings.length; i++) {
          const recording = bookingDetails.recordings[i];
          formData.append('recordings', {
            uri: recording.uri,
            type: 'audio/m4a',
            name: `recording-${i}.m4a`
          } as any);
        }
      }
  
      // Add booking details as JSON string
      const bookingJSON = JSON.stringify({
        amount: bookingDetails.amount,
        options: bookingDetails.options,
        description: bookingDetails.description,
        email: bookingDetails.email
      });
      formData.append('booking_details', bookingJSON);
  
      // Configure axios request
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 60000, // 60 second timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        transformRequest: (data, _headers: Record<string, any>) => {
          return data;
        },
      };
  
      // Send to backend with improved error handling
      try {
        const response = await axios.post(
          `${BACKEND_URL}api/order/complete/`,
          formData,
          config
        );
  
        if (response.status === 201) {
          Alert.alert(
            'Success',
            'Booking confirmed successfully!',
            [{ 
              text: 'OK', 
              onPress: () => router.push({
                pathname: '/orders',
                params: { order_id: paymentData.razorpay_order_id}
              }) }]
          );
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      } catch (axiosError) {
        // Handle specific axios errors
        if (axios.isAxiosError(axiosError)) {
          let errorMessage = 'Failed to process booking';
          
          if (axiosError.code === 'ECONNABORTED') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
          } else if (!axiosError.response) {
            errorMessage = 'Unable to connect to server. Please check your internet connection.';
          } else if (axiosError.response.status === 413) {
            errorMessage = 'Files are too large. Please reduce file sizes and try again.';
          } else {
            errorMessage = axiosError.response?.data?.message || 
                          'An unexpected error occurred while processing your booking.';
          }
          
          // Log detailed error for debugging
          console.error('Detailed error:', {
            code: axiosError.code,
            message: axiosError.message,
            response: axiosError.response?.data,
            status: axiosError.response?.status
          });
  
          throw new Error(errorMessage);
        }
        throw axiosError; // Re-throw if it's not an axios error
      }
    } catch (error) {
      console.error('Transaction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process booking';
      Alert.alert('Error', errorMessage);
      throw error; // Re-throw to allow retry logic to work
    }
  };

  const initiatePayment = async () => {
    if (!profileData.email) {
      Alert.alert('Error', 'Please complete your profile details first');
      return;
    }
  
    setIsLoading(true);
    try {
      const amountInPaise = Math.round(parseFloat(totalAmount) * 100);
      if (isNaN(amountInPaise) || amountInPaise <= 0) {
        throw new Error('Invalid amount');
      }
  
      // Create order with enhanced retry logic and timeout handling
      const maxRetries = 3;
      let attempt = 0;
      let orderResponse;
  
      while (attempt < maxRetries) {
        try {
          orderResponse = await axios.post(
            `${BACKEND_URL}api/order/create/`,
            {
              amount: amountInPaise,
              currency: 'INR'
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 60000, // Increased timeout to 60 seconds
              validateStatus: (status) => status < 500, // Consider only 500+ errors for retry
            }
          );
  
          // Check if we got a successful response
          if (orderResponse.status === 201) {
            break;
          }
          throw new Error(`Server responded with status: ${orderResponse.status}`);
        } catch (error) {
          attempt++;
          console.log(`Attempt ${attempt} failed:`, error);
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Exponential backoff with a maximum of 5 seconds
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
  
      if (!orderResponse?.data?.data?.order_id) {
        throw new Error('Invalid order response from server');
      }
  
      const bookingDetails: BookingDetails = {
        amount: totalAmount,
        options: options,
        description: description,
        images: imageUris.map(uri => ({
          uri,
          type: 'image/jpeg',
          name: `image-${Date.now()}.jpg`
        })),
        recordings: recordings.map(rec => ({
          uri: rec.file,
          type: 'audio/m4a',
          name: `recording-${Date.now()}.m4a`
        })),
        email: profileData.email
      };
  
      const razorpayOptions = {
        description: 'Credits towards consultation',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: 'rzp_test_6DPEFbutV2mNls',
        order_id: orderResponse.data.data.order_id,
        amount: amountInPaise,
        name: 'Radbo Designs',
        prefill: {
          email: profileData.email,
          contact: profileData.phone || '',
          name: profileData.first_name || ''
        },
        theme: { color: '#F37254' },
        retry: {
          enabled: true,
          max_count: 3
        }
      };
  
      // Open Razorpay and wait for the response
      const paymentData = await RazorpayCheckout.open(razorpayOptions);
  
      // If payment is successful, try to complete the order with retry logic
      let completeOrderAttempt = 0;
      while (completeOrderAttempt < maxRetries) {
        try {
          await handlePaymentSuccess(paymentData, bookingDetails);
          break;
        } catch (error) {
          completeOrderAttempt++;
          console.log(`Complete order attempt ${completeOrderAttempt} failed:`, error);
          
          if (completeOrderAttempt === maxRetries) {
            // If all retries failed but payment was successful, show a special message
            Alert.alert(
              'Payment Successful',
              'Your payment was successful but we had trouble confirming your booking. Please contact support with your payment ID: ' + paymentData.razorpay_payment_id,
              [{ 
                text: 'OK', 
                onPress: () => router.push({
                  pathname: '/orders',
                  params: { order_id: paymentData.razorpay_order_id}
                }) }]
            );
            return;
          }
          
          const delay = Math.min(1000 * Math.pow(2, completeOrderAttempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
  
    } catch (error) {
      console.error('Payment initiation error:', error);
      let errorMessage = 'Failed to initiate payment. Please try again.';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'The request timed out. Please check your internet connection and try again.';
        } else if (!error.response) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        } else {
          errorMessage = error.response.data?.message || 'An unexpected error occurred.';
        }
      }
  
      Alert.alert(
        'Payment Error',
        errorMessage,
        [{ text: 'OK' }],
        { cancelable: false }
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
