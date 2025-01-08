import { Image, ScrollView, Text, View, Pressable, StyleSheet, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from 'expo-av';
import { icons } from "@/constants";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import CustomButton from '@/components/CustomButton';

interface RecordingLine {
  sound: Audio.Sound;
  duration: string;
  file: string;
}

const BACKEND_URL = 'http://192.168.1.4:8000/';

const Update = () => {
  const params = useLocalSearchParams();
  const previewImage = params.previewImage as string;
  const orderId = params.orderId as string; // Make sure to pass orderId in your navigation
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [recordings, setRecordings] = useState<RecordingLine[]>([]);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('order_id', orderId);
      formData.append('description', description.trim());

      // Add voice messages if any
      if (recordings.length > 0) {
        // Get the last recording (most recent one)
        const lastRecording = recordings[recordings.length - 1];
        const uri = lastRecording.file;
        
        // Create file name from URI
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];

        formData.append('voice_messages', {
          uri: uri,
          name: fileName,
          type: 'audio/m4a' // or the appropriate mime type
        } as any);
      }

      const response = await fetch(`${BACKEND_URL}api/order/submit-update/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit update');
      }

      Alert.alert(
        'Success',
        'Update submitted successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to submit update'
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  // Voice recording functions
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
    setRecordings([]);
  }
  

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        <View className="flex-row items-center justify-center mt-5">
          <Pressable className="absolute left-5" onPress={() => router.back()}>
            <Image
              source={icons.backArrow}
              style={{
                width: 24,
                height: 24,
                tintColor: 'white',
              }}
            />
          </Pressable>
          <Text className="text-white-100 font-pregular text-2xl">Update My Design</Text>
        </View>

        {/* Preview Image */}
        <View style={styles.imageContainer}>
          <Text className="text-white-200 font-pregular text-lg mb-3">Current Design</Text>
          <Image
            source={{ uri: previewImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        {/* Description Box */}
        <View style={styles.section}>
          <Text className="text-white-200 font-pregular text-lg mb-5">Description</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Write your update message here..."
            placeholderTextColor="#E2E8F0"
            multiline
          />
        </View>

        {/* Voice Recording Section */}
        <View style={styles.section}>
          <Text className="text-white-200 font-pregular text-lg mb-5">Voice Message</Text>
          <Pressable 
            style={styles.recordButton} 
            onPress={recording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>
              {recording ? 'Stop' : 'Start Recording'}
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
        </View>

        {/* Submit Button */}
        <View style={styles.section}>
          <CustomButton 
            title={isSubmitting ? "Submitting..." : "Submit Update"}
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`mt-6 bg-secondary-200 ${isSubmitting ? 'opacity-70' : ''}`}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#1A202C',
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
  recordButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
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
  recordingText: {
    flex: 1,
    margin: 16,
    color: '#FFFFFF',
  },
  buttonText: {
    color: '#1A202C',
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
  },
});

export default Update;