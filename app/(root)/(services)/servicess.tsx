import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { icons } from '@/constants';
import { router } from 'expo-router';

// Define the structure of a service
type Service = {
  price: number;
  options: string[]; // Unique checkbox options for each service
};

type SelectedOption = {
  servicePrice: number;
  selectedOptions: string[];
};

// Component for individual checkboxes
function MyCheckbox({ onChange, checked }: { onChange: () => void; checked: boolean }) {
  return (
    <Pressable
      style={[styles.checkboxBase, checked && styles.checkboxChecked]}
      onPress={onChange}>
      {checked && <Ionicons name="checkmark" size={18} color="black" />}
    </Pressable>
  );
}

export default function ChooseServicePage() {
  // Define all services with unique checkbox options
  const services: Service[] = [
    { price: 199, options: ['Social Media Designs', 'Business Card', 'Envelope', 'Letterhead', 'E Card Invitation'] },
    { price: 999, options: ['Flyer', 'Poster', 'Daily Calendar', 'Diary / Magazine / Book Cover', 'Product Label', 'Invitation'] },
    { price: 1499, options: ['Packaging Design', 'Menu Card', 'Brochure', 'Monthly Calendar', 'Presentation'] },
    { price: 1999, options: ['Logo Design (Single Option)', 'Logo Intro (10 - 15 Sec Video)'] },
    { price: 4999, options: ['Static Website'] },
    { price: 5999, options: ['Social Media Marketing Package'] },
    { price: 7999, options: ['Retainership Plan'] },
  ];

  

  // State to manage the checked state for each option
  const [checkboxStates, setCheckboxStates] = useState<boolean[][]>(
    services.map((service) => Array(service.options.length).fill(false))
  );

  const [selectedOptions, setSelectedOptions] = useState<SelectedOption>({
    servicePrice: 0,
    selectedOptions: [],
  });

  const updateCheckbox = (serviceIndex: number, optionIndex: number) => {
    const updatedStates = [...checkboxStates];
    updatedStates[serviceIndex][optionIndex] = !updatedStates[serviceIndex][optionIndex];
    setCheckboxStates(updatedStates);

    // Update selected options
    let updatedSelectedOptions = { ...selectedOptions };
    const option = services[serviceIndex].options[optionIndex];

    if (updatedStates[serviceIndex][optionIndex]) {
      updatedSelectedOptions.servicePrice += services[serviceIndex].price;
      updatedSelectedOptions.selectedOptions.push(option);
    } else {
      updatedSelectedOptions.servicePrice -= services[serviceIndex].price;
      updatedSelectedOptions.selectedOptions = updatedSelectedOptions.selectedOptions.filter((o) => o !== option);
    }

    setSelectedOptions(updatedSelectedOptions);
  };

  const renderService = (service: Service, serviceIndex: number) => {
    const isLastThree = serviceIndex >= services.length - 3; // Check if it's one of the last 3 boxes
    const additionalTexts = [
      '* From next year, renewal charges Rs. 3500 for Domain and Server',
      '* 12 posts , ad campaign per month Estimated reach: 100k per month, gain 1k Followers Prebooking for 3months required',
      '* Prebooking for 3 months required',
    ]; // Custom texts for last three boxes

    // Check if the price is 1499 or 1999 for changing "24hr" to "48hr"
    const designTime = service.price === 1499 || service.price === 1999 ? '48hr' : '24hr';

    return (
      <View key={serviceIndex} className="bg-primary-100 p-5 rounded-lg w-11/12 flex-row justify-between mt-10 relative">
        {/* Left Content */}
        <View className="w-2/3">
          <View className="bg-secondary-200 w-32 h-6 justify-center items-center mb-4 rounded-md">
            <Text className="text-primary-300 font-pregular text-sm">Only Per Design</Text>
          </View>
          <Text className="text-white-100 font-pregular text-4xl mb-4">₹ {service.price}</Text>
          <View>
            {service.options.map((option, optionIndex) => (
              <View key={optionIndex} className="flex-row items-center mb-3">
                <MyCheckbox
                  checked={checkboxStates[serviceIndex][optionIndex]}
                  onChange={() => updateCheckbox(serviceIndex, optionIndex)}
                />
                <Pressable onPress={() => updateCheckbox(serviceIndex, optionIndex)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text className="text-white-200 font-pregular text-lg ml-2">{option}</Text>
                </Pressable>
              </View>
            ))}
            {/* Additional text below options for last three boxes */}
            {isLastThree && (
              <Text className="text-white-300 text-sm font-pregular mt-2">
                {additionalTexts[serviceIndex - (services.length - 3)]}
              </Text>
            )}
          </View>
        </View>

        {/* Right Content */}
        {!isLastThree && ( // Conditionally hide the "Get your Design within 24hr" box for the last three services
          <View style={styles.designBox}>
            <Text className="text-white-100 text-center font-pregular text-base">
              Get your Design within
              {"\n"}
              <Text className="text-secondary-200 font-pregular text-3xl">{designTime}</Text>
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-center mt-5">
        <Pressable
          className="absolute left-5"
          onPress={() => router.push(`/(root)/(tabs)/home`)} >
          <Image
            source={icons.backArrow}
            style={{
              width: 24,
              height: 24,
              tintColor: 'white',
            }}
          />
        </Pressable>
        <Text className="text-white-100 font-pregular text-2xl">Choose a Service</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 80 }}>
        {services.map((service, index) => renderService(service, index))}
      </ScrollView>

      {/* Rectangular Bar */}
      {selectedOptions.selectedOptions.length > 0 && (
        <View style={styles.bar}>
          {/* Left side: Total Amount */}
          <View style={styles.leftSide}>
            <Text className="text-white-100 font-pregular text-3xl">Total: ₹ {selectedOptions.servicePrice}</Text>
          </View>
          
          {/* Right side: Button */}
          <View className='w-40 h-20 justify-center items-center bg-secondary-200 rounded-lg'>
          <Pressable
            className='text-center justify-center h-100% w-100%'
            onPress={() =>
              router.push({
                pathname: '/booking',
                params: {
                  totalAmount: selectedOptions.servicePrice,
                  selectedOptions: JSON.stringify(selectedOptions.selectedOptions), // Pass as a JSON string
                },
              })
            }>
            <Text className="text-black font-pregular text-lg">Proceed</Text>
          </Pressable>

          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  checkboxBase: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E2E8F0', // secondary-200
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#FFCE07', // secondary-200
  },
  designBox: {
    width: 100,
    height: 80,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#1A202C',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  bar: {
    width: 372,
    height: 64,
    backgroundColor: '#000',
    borderBlockColor: '#262626',
    borderRadius: 8,
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  leftSide: {
    flex: 1,
  },
  rightSide: {
    width: 174,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0', // secondary-200
    borderRadius: 8,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    borderRadius: 8,
  },
});
