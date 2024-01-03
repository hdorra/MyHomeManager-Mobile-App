import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage'; // Import this

export const db = firestore();
export const authInstance = auth();
export const Timestamp = firestore.Timestamp;
export const storageInstance = storage(); // Use a different name here

