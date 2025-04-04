import {
  TextInput,
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { InputFieldProps } from "@/types/type";

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  editable = true,
  ...props
}: InputFieldProps) => {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-2 w-full">
          <Text className={`text-lg font-pregular text-white-200 mb-3 ${labelStyle}`}>
            {label}
          </Text>
          <View
            className={`flex flex-row justify-start items-center relative rounded-lg border-white-300 border-2 bg-white-200 ${
              !editable ? 'opacity-50' : ''
            } ${containerStyle}`}
          >
            {icon && (
              <Image
                source={icon}
                className={`w-6 h-6 ml-4 ${iconStyle}`}
              />
            )}
            <TextInput
              className={`rounded-full p-4 font-pregular text-[15px] flex-1 ${inputStyle}`}
              secureTextEntry={secureTextEntry}
              editable={editable}
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;