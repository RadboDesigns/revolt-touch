import { Image, ScrollView, Pressable, Text, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from '@/constants';
import { router } from 'expo-router';
import StepIndicator from 'react-native-step-indicator';
import { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-expo";
import CustomButton from '@/components/CustomButton';

const OrderCard = ({ order, customStyles }) => {
  // Map backend status to step indicator position
  const statusToPosition = {
    1: 1, // Designing -> Design
    2: 2, // Testing -> Testing
    3: 2, // Correction -> Testing (stays in testing phase)
    4: 3  // Delivered -> Completed
  };

  const labels = ["Research", "Design", "Testing", "Completed"];
  const currentPosition = statusToPosition[order.order_status] || 0;

  return (
    <View style={{
      width: 372,
      height: 370,
      backgroundColor: '#121212',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20
    }}>
      <View style={{
        width: '100%',
        alignItems: 'center'
      }}>
        {/* Order Details */}
        <View style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginBottom: 10
        }}>
          <Text style={{ color: '#D0D0D0' }}>Selected Package</Text>
          <Text style={{ color: '#FFFFFF' }}>{order.checked_option || 'Logo Design'}</Text>
        </View>
        <View style={{ width: '100%', height: 1, backgroundColor: '#262626' }} />

        <View style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginBottom: 10
        }}>
          <Text style={{ color: '#D0D0D0' }}>Ordered Time</Text>
          <Text style={{ color: '#FFFFFF' }}>
            {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <View style={{ width: '100%', height: 1, backgroundColor: '#262626' }} />

        <View style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginBottom: 10
        }}>
          <Text style={{ color: '#D0D0D0' }}>Delivery Time</Text>
          <Text style={{ color: '#FFFFFF' }}>
            {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Pending'}
          </Text>
        </View>
        <View style={{ width: '100%', height: 1, backgroundColor: '#262626' }} />

        <View style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginBottom: 10
        }}>
          <Text style={{ color: '#D0D0D0' }}>Order ID</Text>
          <Text style={{ color: '#FFFFFF' }}>{order.custom_order_id}</Text>
        </View>
        <View style={{ width: '100%', height: 1, backgroundColor: '#262626' }} />

        {/* Track Your Design Section */}
        <View style={{
          width: '100%',
          paddingHorizontal: 20,
          marginTop: 15
        }}>
          <Text style={{ color: '#D0D0D0', marginBottom: 10 }}>Track Your Design</Text>
          
          {/* Step Indicator */}
          <View style={{ paddingHorizontal: 10 }}>
            <StepIndicator
              customStyles={customStyles}
              currentPosition={currentPosition}
              labels={labels}
              stepCount={4}
            />
          </View>
          
          {/* Show View Image button only if reference_images exists */}
          {order.preview_image && (
            <CustomButton 
              title="View Image"
              onPress={() => router.push({
                pathname: '/yourDesign',
                params: {
                  order_id: order.order_id,
                },
              })} 
              className="mt-6 bg-secondary-200" 
            />
          )}
        </View>
      </View>
    </View>
  );
};

const Chat = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    email: user?.primaryEmailAddress?.emailAddress || "",
  });
  const [orders, setOrders] = useState([]);

  // Custom styles for the step indicator with fixed stroke width
  const customStyles = {
    stepIndicatorSize: 25,
    currentStepIndicatorSize: 30,
    separatorStrokeWidth: 2,
    currentStepStrokeWidth: 3,
    stepStrokeCurrentColor: '#FFCE07',
    stepStrokeWidth: 3, // Increased from 2 to make it more visible
    stepStrokeFinishedColor: '#FFCE07',
    stepStrokeUnFinishedColor: '#262626',
    separatorFinishedColor: '#FFCE07',
    separatorUnFinishedColor: '#262626',
    stepIndicatorFinishedColor: '#FFCE07',
    stepIndicatorUnFinishedColor: '#121212',
    stepIndicatorCurrentColor: '#121212',
    stepIndicatorLabelFontSize: 13,
    currentStepIndicatorLabelFontSize: 13,
    stepIndicatorLabelCurrentColor: '#FFCE07',
    stepIndicatorLabelFinishedColor: '#FFFFFF',
    stepIndicatorLabelUnFinishedColor: '#D0D0D0',
    labelColor: '#D0D0D0',
    labelSize: 13,
    currentStepLabelColor: '#FFCE07'
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.2:8000/api/order/show/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profileData.email
        })
      });
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profileData.email) {
      fetchOrders();
    }
  }, [profileData.email]);

  return (
    <View className="flex-1 bg-black">
      <View className="flex-row items-center justify-center mt-5">
        <Pressable
          className="absolute left-5"
          onPress={() => router.push(`/(root)/(tabs)/home`)}
        >
          <Image
            source={icons.backArrow}
            style={{
              width: 24,
              height: 24,
              tintColor: 'white',
            }}
          />
        </Pressable>
        <Text className="text-white-100 font-pregular text-2xl">My Orders</Text>
      </View>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            alignItems: 'center',
            paddingVertical: 20
          }}
        >
          {orders.map((order, index) => (
            <OrderCard 
              key={order.order_id || index} 
              order={order}
              customStyles={customStyles}
            />
          ))}
          {orders.length === 0 && !isLoading && (
            <Text style={{ color: '#D0D0D0', marginTop: 20 }}>No orders found</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Chat;