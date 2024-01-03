import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, TouchableOpacity, ScrollView, Image } from 'react-native';
import { db } from '../firebase/config';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { storageInstance } from '../firebase/config';
import auth from '@react-native-firebase/auth';

import firestore from '@react-native-firebase/firestore';//added before of fromdate error?

const STATUS_NOT_STARTED = 'Not Started';
const STATUS_PENDING = 'Pending';
const STATUS_COMPLETED = 'Completed';

function TodoDetail({ route, navigation }) {
    const { todoId } = route.params;
    const { homeId } = route.params; // Added this line to get the homeId
    const [todoData, setTodoData] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [dueDate, setDueDate] = useState(new Date());
    //const [tempTodoData, setTempTodoData] = useState(null);
    const [tempTodoData, setTempTodoData] = useState({
        assignedTo: isEditMode && todoData ? todoData.assignedTo || '' : '', // Set based on edit mode and todoData availability
        status: STATUS_NOT_STARTED, // Default status
    });
    const [newComment, setNewComment] = useState('');
    const currentUser = auth().currentUser;
    const Timestamp = firestore.Timestamp; //added for fromdate error?

    //const [selectedMember, setSelectedMember] = useState(''); // State variable to store the selected member once picked
    const [membersList, setMembersList] = useState([]); // State variable to store the list of members for picker choice


    useEffect(() => {
        const todoDoc = db.collection('todos').doc(todoId);
        const unsubscribe = todoDoc.onSnapshot((doc) => {
            if (doc.exists) {
                //Initialize tempTodoData.comments as an Array
                const fetchedData = {
                    id: doc.id,
                    ...doc.data(),
                    comments: doc.data().comments || []
                };
                setTodoData(fetchedData);
                setTempTodoData(fetchedData);  // Set temp data
            } else {
                Alert.alert("Error", "Todo not found!");
                navigation.goBack();
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Check if the user has access to the home
        const currentUser = auth().currentUser;
        const unsubscribe = db.collection('homes').doc(homeId)
            .onSnapshot(snapshot => {
                if (snapshot.exists) {
                    const isOwner = snapshot.data().userId === currentUser.email;
                    const members = snapshot.data().members || [];

                    if (isOwner || members.includes(currentUser.email)) {
                        // User has access to the home
                    } else {
                        // User has been removed from the home
                        // Navigate back to the home list
                        navigation.navigate('HomeList');
                    }
                }
            });

        return () => unsubscribe();
    }, [homeId, currentUser, navigation]);

    useEffect(() => {
        console.log("Fetching members...");
        console.log("homeId:", homeId);
        console.log(db.collection('homes').doc(homeId))
        const unsubscribe = db.collection('homes').doc(homeId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    console.log("In doc.exists block");
                    console.log(doc.data().members)
                    const members = doc.data().members || [];
                    console.log("Members List:", members);
                    setMembersList(members);
                    console.log("Members fetched successfully."); 3

                } else {
                    console.log("Document does not exist.");
                }
            }, error => {
                console.error("Error fetching members:", error);
                console.log("Unsubscribe:", unsubscribe)
            });

        return () => {
            console.log("Unsubscribing from members...");
            unsubscribe(); // Call the unsubscribe function to remove the listener
        };
    }, [homeId]);



    if (!todoData) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading...</Text>
            </View>
        );
    }


    const handleUpdateOrSave = async () => {
        if (isEditMode) {
            try {
                await db.collection('todos').doc(todoId).update(tempTodoData); // Save tempTodoData to Firestore
                setTodoData(tempTodoData);// Update todoData to reflect saved changes
                setIsEditMode(false);
                Alert.alert("Success", "Todo updated successfully!");
            } catch (error) {
                Alert.alert("Error", error.message);
            }
        } else {
            setIsEditMode(true);
        }
    };
    const discardChanges = () => {
        setTempTodoData(todoData);  // Reset tempTodoData to the original
        setIsEditMode(false);
    };

    const deleteTodo = async () => {
        try {
            await db.collection('todos').doc(todoId).delete();
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    //Added image handling
    const handleImageUpload = async (response) => {
        console.log('Image Picker Response: ', response);

        if (response.didCancel) {
            return;
        } else if (response.error) {
            Alert.alert('Error', response.error);
            return;
        } else {
            // Update this line to extract the URI from the assets array
            const uploadUri = response?.assets[0]?.uri;
            if (!uploadUri) {
                Alert.alert('Error', 'Image URI not found.');
                return;
            }

            const imageName = uploadUri.substring(uploadUri.lastIndexOf('/') + 1);
            const uploadRef = storageInstance.ref(`todos/${todoId}/images/${imageName}`);
            try {
                await uploadRef.putFile(uploadUri);
                const downloadURL = await uploadRef.getDownloadURL();
                setTempTodoData(prevState => ({ ...prevState, images: [...(prevState.images || []), downloadURL] }));


            } catch (error) {
                Alert.alert('Error', error.message);
            }
        }
    };

    const handleImageSelection = () => {
        launchImageLibrary({
            mediaType: 'photo',
            quality: 0.5,
        }, handleImageUpload);
    };

    const handleCameraLaunch = () => {
        launchCamera({
            mediaType: 'photo',
            quality: 0.5,
        }, handleImageUpload);
    };


    //End

    //Add image functionality to update?
    const deleteImage = (url) => {
        const newImages = tempTodoData.images.filter(image => image !== url);
        setTempTodoData(prevState => ({ ...prevState, images: newImages }));
    };

    const renderEditMode = () => {
        return (
            <>
                {/* Add a dropdown to select the assigned member */}

                <Picker
                    selectedValue={tempTodoData.assignedTo || ''}
                    onValueChange={(itemValue) =>
                        setTempTodoData((prevState) => ({
                            ...prevState,
                            assignedTo: itemValue,
                        }))
                    }
                >
                    <Picker.Item label="Assign To" value="" />
                    {membersList.map((email) => (
                        <Picker.Item key={email} label={email} value={email} />
                    ))}
                </Picker>
                {isEditMode && (
                    <Picker
                        selectedValue={tempTodoData.status}
                        onValueChange={(itemValue) =>
                        setTempTodoData((prevState) => ({
                            ...prevState,
                            status: itemValue,
                        }))
                        }
                    >
                        <Picker.Item label="Not Started" value={STATUS_NOT_STARTED} />
                        <Picker.Item label="Pending" value={STATUS_PENDING} />
                        <Picker.Item label="Completed" value={STATUS_COMPLETED} />
                    </Picker>
                    )}

                <Button title="Select Image from Gallery" onPress={handleImageSelection} />
                <Button title="Capture Image with Camera" onPress={handleCameraLaunch} />

                {/*Scrolling image part */}
                {tempTodoData.images && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginVertical: 10 }}
                >
                    {tempTodoData.images.map((url, index) => (
                        <View key={index}>
                            <Image source={{ uri: url }} style={{ width: 100, height: 100, margin: 10 }} />
                            <TouchableOpacity
                                style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}
                                onPress={() => deleteImage(url)}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>X</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

                <Button title="Save Changes" onPress={handleUpdateOrSave} />
                <Button title="Discard Changes" onPress={discardChanges} color="red" />

            </>
        );
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            Alert.alert("Error", "Comment can't be empty.");
            return;
        }

        // Check if Timestamp is defined
        if (!(Timestamp && Timestamp.fromDate)) {
            console.error("Timestamp or its fromDate method is not defined!");
            return;
        }

        const currentUser = auth().currentUser; // Get the currently logged-in user

        if (!currentUser) {
            Alert.alert("Error", "You must be logged in to add a comment.");
            return;
        }

        const newCommentObject = {
            text: newComment,
            from: currentUser.email, // Append the user's email (user ID) to the comment
            timeStamp: Timestamp.fromDate(new Date())
        };

        // Ensure tempTodoData.comments is an Array Before Spreading
        const updatedComments = [...(tempTodoData.comments || []), newCommentObject];

        setTempTodoData(prevState => ({ ...prevState, comments: updatedComments }));
        setNewComment('');

        // To instantly save the comment to Firestore:
        try {
            await db.collection('todos').doc(todoId).update({ comments: updatedComments });
            Alert.alert("Success", "Comment added successfully!");
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };



    const renderViewMode = () => {
        const currentUser = auth().currentUser;
        return (
            <>
                {/* {todoData.images && todoData.images.map((url, index) => (
                    <Image key={index} source={{ uri: url }} style={{ width: 100, height: 100, margin: 10 }} />
                    
                ))} */}
                {todoData.images && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginVertical: 10 }}
                    >
                        {todoData.images.map((url, index) => (
                        <Image
                            key={index}
                            source={{ uri: url }}
                            style={{ width: 100, height: 100, margin: 10 }}
                        />
                        ))}
                    </ScrollView>
                    )}
                <Text>Assigned To: {todoData.assignedTo}</Text>
                <Text>Status: {todoData.status}</Text>
                {/* Display the comments */}
                {tempTodoData && tempTodoData.comments && tempTodoData.comments.map((comment, index) => (

                    <View key={index} style={comment.from === ('user' ? currentUser.email : 'user') ? styles.userCommentContainer : styles.assigneeCommentContainer}>
                        <Text style={comment.from === (currentUser ? currentUser.email : 'user') ? styles.userCommentText : styles.assigneeCommentText}>
                            {comment.from}: {comment.text}
                        </Text>
                        <Text>{format(comment.timeStamp.toDate ? comment.timeStamp.toDate() : comment.timeStamp, 'MMMM dd, yyyy hh:mm a')}</Text>
                    </View>
                ))}



                {/* Input for new comments */}
                <TextInput
                    placeholder="Add a comment..."
                    value={newComment}
                    onChangeText={text => setNewComment(text)}
                />
                <Button title="Add Comment" onPress={handleAddComment} />

                <Button title="Edit Todo" onPress={() => setIsEditMode(true)} />
                <Button title="Delete Todo" onPress={deleteTodo} color="red" />
            </>
        );
    };
    return (
        <ScrollView style={styles.container}>
            {todoData && (
                <>
                    <TextInput
                        value={isEditMode ? tempTodoData.task : todoData.task}
                        onChangeText={(text) => setTempTodoData(prevState => ({ ...prevState, task: text }))}
                        placeholder="Task Name"
                        style={styles.input}
                        editable={isEditMode}
                    />
                    <TextInput
                        value={isEditMode ? tempTodoData.description : todoData.description}
                        onChangeText={(text) => setTempTodoData(prevState => ({ ...prevState, description: text }))}
                        placeholder="Description"
                        style={styles.input}
                        editable={isEditMode}
                    />
                    <Button title="Select Due Date" onPress={() => setShowDatePicker(true)} disabled={!isEditMode} />
                    <Text style={{ marginVertical: 10 }}>{format(new Date(todoData.dueDate.toDate()), 'MMMM dd, yyyy')}</Text>
                    {showDatePicker && (
                        <DateTimePicker
                            value={new Date(todoData.dueDate.toDate())}
                            mode="date"
                            onChange={(event, selectedDate) => {
                                const currentDate = selectedDate || todoData.dueDate.toDate();
                                setShowDatePicker(false);
                                setTempTodoData(prevState => ({ ...prevState, dueDate: currentDate }));
                            }}
                        />
                    )}
                    {isEditMode ? renderEditMode() : renderViewMode()}
                </>
            )}
        </ScrollView>
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
    userComment: {
        backgroundColor: '#EFEFEF',
        padding: 5,
        borderRadius: 5
    },
    assigneeComment: {
        backgroundColor: '#D1E7DD',
        padding: 5,
        borderRadius: 5
    },
    userCommentContainer: {
        backgroundColor: '#EFEFEF',
        padding: 5,
        borderRadius: 5,
        alignSelf: 'flex-end', // Align comments from the current user to the right
        marginBottom: 10, // Add some margin between comments
        maxWidth: '70%', // Limit the width of the comment bubble
    },

    // Styles for comments from other users
    assigneeCommentContainer: {
        backgroundColor: '#D1E7DD',
        padding: 5,
        borderRadius: 5,
        alignSelf: 'flex-start', // Align comments from other users to the left
        marginBottom: 10, // Add some margin between comments
        maxWidth: '70%', // Limit the width of the comment bubble
    },
});

export default TodoDetail;