import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, Image, TouchableOpacity } from 'react-native';
import { db } from '../firebase/config';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { storageInstance } from '../firebase/config';
import auth from '@react-native-firebase/auth';

function AddTodo({ route, navigation }) {
    const { homeId, listId } = route?.params || {};
    const currentUser = auth().currentUser;
   
    const [isHomeValid, setIsHomeValid] = useState(null);
    const [task, setTask] = useState('');
    const [assignedTo, setAssignedTo] = useState('Unassigned');
    const [taskStatus, setTaskStatus] = useState('Not Started');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [images, setImages] = useState([]);
    const [membersList, setMembersList] = useState([]);

    useEffect(() => {
        const checkHomeValidity = async () => {
            if (!homeId) {
                Alert.alert("Error", "Missing Home ID!");
                navigation.goBack();
                return;
            }

            try {
                const homeDoc = await db.collection('homes').doc(homeId).get();
                if (homeDoc.exists) {
                    setIsHomeValid(true);
                } else {
                    Alert.alert("Error", "The provided home ID is not valid.");
                    navigation.goBack();
                }
            } catch (error) {
                Alert.alert("Error", "Failed to check home validity.");
                navigation.goBack();
            }
        };

        checkHomeValidity();
    }, [homeId, navigation]);

    //Added this for debugging purposes
    useEffect(() => {
        console.log("Updated Images Array: ", images);
    }, [images]);
    //End of debugging part

    useEffect(() => {
        if (!homeId || !currentUser) {
            Alert.alert("Error", "Missing Home ID or User!");
            navigation.goBack();
            return;
        }

        const unsubscribe = db.collection('homes').doc(homeId)
            .onSnapshot(snapshot => {
                if (snapshot.exists) {
                    const isOwner = snapshot.data().userId === currentUser.email;
                    const members = snapshot.data().members || [];

                    if (isOwner || members.includes(currentUser.email)) {
                        setMembersList(members);
                    } else {
                        Alert.alert("Error", "You don't have access to this home.");
                        navigation.goBack();
                    }
                } else {
                    Alert.alert("Error", "The provided home ID is not valid.");
                    navigation.goBack();
                }
            });

        return () => unsubscribe();
    }, [homeId, currentUser, navigation]);

    if (isHomeValid === null) {
        return <Text>Loading...</Text>;
    }

    const handleImageSelection = () => {
        const options = {
            title: 'Select Todo Image',
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };

        launchImageLibrary(options, response => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else {
                const selectedImage = response.assets[0];
                if (selectedImage && selectedImage.uri) {
                    setImages(prev => [...prev, selectedImage]);
                }
                console.log("Image URI: ", response.uri); // debugging purposes
            }
        });
    };

    const handleCameraLaunch = () => {
        const options = {
            title: 'Take Todo Image',
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };

        launchCamera(options, response => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else {
                const selectedImage = response.assets[0];
                if (selectedImage && selectedImage.uri) {
                    setImages(prev => [...prev, selectedImage]);
                }
                console.log("Image URI response: ", response); // debugging purposes
            }
        });
    };


    const uploadImageToFirebase = async (uri) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const ref = storageInstance.ref().child("todos-images/" + new Date().toISOString());

            await ref.put(blob);
            return await ref.getDownloadURL();
        } catch (error) {
            console.error("Failed to upload image:", error);
            throw error;
        }
    };

    const handleCreateTodo = async () => {
        if (!task) {
            Alert.alert("Error", "Task name is required.");
            return;
        }

        const todoData = {
            task: task,
            assignedTo: assignedTo,
            status: taskStatus,
            dueDate: dueDate,
            homeId: homeId,
            listId: listId,
        };

        if (description) todoData.description = description;

        if (images && images.length > 0) {
            const validImages = images.filter(img => img && img.uri);
            if (validImages.length > 0) {
                // Upload each image to Firebase Storage and get their download URLs
                //const uploadedImageURLs = await Promise.all(validImages.map(img => uploadImageToFirebase(img.uri))); --> commented out, check second block
                let uploadedImageURLs = [];
                try {
                    uploadedImageURLs = await Promise.all(validImages.map(img => uploadImageToFirebase(img.uri)));
                } catch (error) {
                    console.error("Failed to upload some or all images:", error);
                    // Decide how to handle the error. Maybe show an alert to the user.
                    Alert.alert("Error", "Failed to upload some or all images.");
                    return;  // Stop further execution if you want
                }
                todoData.images = uploadedImageURLs;
            }
        }

        db.collection('todos').add(todoData)
            .then(() => {
                Alert.alert("Success", "Todo created successfully!");
                navigation.goBack();
            })
            .catch(error => {
                Alert.alert("Error", error.message);
            });
    };

    return (
        <View style={styles.container}>
            <TextInput
                value={task}
                onChangeText={setTask}
                placeholder="Task Name"
                style={styles.input}
            />
            <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                style={styles.input}
            />
            <Button title="Select Image from Gallery" onPress={handleImageSelection} />
            <Button title="Capture Image with Camera" onPress={handleCameraLaunch} />

            <View style={styles.imagesContainer}>
                {images.map((image, index) => {
                    if (!image.uri) {
                        return null; // Skip rendering this image if uri doesn't exist
                    }

                    return (
                        <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                            <TouchableOpacity style={styles.deleteButton} onPress={() => {
                                const newImages = [...images];
                                newImages.splice(index, 1);
                                setImages(newImages);
                            }}>
                                <Text style={styles.deleteText}>X</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>

            <Button title="Select Due Date" onPress={() => setShowDatePicker(true)} />
            <Text style={{ marginVertical: 10 }}>{format(dueDate, 'MMMM dd, yyyy')}</Text>
            {showDatePicker && (
                <DateTimePicker
                    value={dueDate}
                    mode="date"
                    onChange={(event, selectedDate) => {
                        const currentDate = selectedDate || dueDate;
                        setShowDatePicker(false);
                        setDueDate(currentDate);
                    }}
                />
            )}
            <Picker
                selectedValue={assignedTo}
                onValueChange={(itemValue) => setAssignedTo(itemValue)}
                style={styles.picker}
            >
                <Picker.Item label="Unassigned" value="Unassigned" />
                {membersList.map((email) => (
                    <Picker.Item key={email} label={email} value={email} />
                ))}
            </Picker>
            <Button title="Create Todo" onPress={handleCreateTodo} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    input: {
        marginBottom: 10,
        padding: 8,
        borderColor: 'gray',
        borderWidth: 1,
    },
    picker: {
        marginVertical: 10,
    },
    imagesContainer: {
        flexDirection: 'row',
        marginVertical: 10,
    },
    imageWrapper: {
        position: 'relative',
        marginRight: 10,
    },
    imagePreview: {
        width: 60,
        height: 60,
    },
    deleteButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default AddTodo;



