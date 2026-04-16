import * as ImagePicker from 'expo-image-picker';

export type ProfileImagePickResult =
  | { status: 'selected'; uri: string }
  | { status: 'cancelled' }
  | { status: 'permission_denied' };

export const pickProfileImageFromLibrary =
  async (): Promise<ProfileImagePickResult> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      return { status: 'permission_denied' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length || !result.assets[0].uri) {
      return { status: 'cancelled' };
    }

    return {
      status: 'selected',
      uri: result.assets[0].uri,
    };
  };
