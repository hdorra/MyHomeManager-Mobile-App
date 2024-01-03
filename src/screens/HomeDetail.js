import auth from '@react-native-firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { db } from '../firebase/config';

function HomeDetail({ route, navigation }) {
    const { homeId } = route.params;
    const [todoLists, setTodoLists] = useState([]);
    const [inviteeEmail, setInviteeEmail] = useState('');
    const [subscribers, setSubscribers] = useState([]);
    const currentUser = auth().currentUser;
    const [home, setHome] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);

    useEffect(() => {
        const unsubscribe = db.collection('homes').doc(homeId)
            .onSnapshot(snapshot => {
                if (snapshot.exists) {
                    const isOwner = snapshot.data().userId === currentUser.email;
                    const members = snapshot.data().members || [];

                    if (isOwner || members.includes(currentUser.email)) {
                        setHome({ id: snapshot.id, ...snapshot.data() });
                    } else {
                        // User has been removed from the home
                        // Navigate back to the home list
                        navigation.navigate('HomeList');
                    }
                } else {
                    Alert.alert('Notification', 'Home no longer found - deleted.');
                }
            });

        return () => unsubscribe();
    }, [homeId, currentUser.email, navigation]);


    useEffect(() => {
        const unsubscribe = db.collection('todoLists')
            .where('homeId', '==', homeId)
            .onSnapshot(snapshot => {
                const fetchedLists = snapshot.docs.map(doc => {
                    return { id: doc.id, ...doc.data() };
                    
                });
                setTodoLists(fetchedLists);
                console.log("fetchedLists:", fetchedLists);
               
            });

        return () => unsubscribe();
        
    }, [homeId]);

    useEffect(() => {
        const currentUserEmail = auth().currentUser?.email;

        const unsubscribe = db.collection('Invitations')
            .where('homeId', '==', homeId)
            .onSnapshot(snapshot => {
                const fetchedSubscribers = snapshot.docs.map(doc => {
                    return { id: doc.id, ...doc.data() };
                });

                const acceptedInvite = fetchedSubscribers.find(subscriber => subscriber.inviteeEmail === currentUserEmail && subscriber.status === 'Accepted');

                if (acceptedInvite && acceptedInvite.inviterEmail) {
                    fetchedSubscribers.push({
                        id: `inviter-${acceptedInvite.inviterId}`,
                        inviteeEmail: acceptedInvite.inviterEmail,
                        status: "Inviter"
                    });
                }

                setSubscribers(fetchedSubscribers.filter(subscriber => subscriber.inviteeEmail !== currentUserEmail));
            });

        return () => unsubscribe();
    }, [homeId]);

    useEffect(() => {
        const unsubscribe = db.collection('homes').doc(homeId)
            .onSnapshot(snapshot => {
                if (!snapshot.exists) {
                    Alert.alert('Notification', 'Home no longer found - deleted.');
                }
            });

        return () => {
            unsubscribe();
        };
    }, [navigation, homeId]);

    const handleDeleteHome = () => {
        if (!home) return;

        if (home.userId !== currentUser.email) {
            Alert.alert("Error", "You don't have permission to delete this home.");
            return;
        }

        db.collection('homes').doc(homeId).delete()
            .then(() => {
                Alert.alert("Success", "Home successfully deleted.");
                navigation.goBack();
            })
            .catch(error => {
                Alert.alert("Error", error.message);
            });
    };

    const sendInvitation = async (email) => {
        const currentUser = auth().currentUser;

        if (!currentUser) {
            Alert.alert("Error", "You must be logged in to send an invite!");
            return;
        }

        if (email === currentUser.email) {
            Alert.alert("Error", "You cannot invite yourself!");
            return;
        }

        const existingInvite = await db.collection('Invitations')
            .where('homeId', '==', homeId)
            .where('inviteeEmail', '==', email)
            .get();
        if (!existingInvite.empty) {
            if (existingInvite.docs[0].data().status === 'Pending') {
                Alert.alert("Error", "There's already a pending invitation for this email!");
                return;
            }
            if (existingInvite.docs[0].data().status === 'Accepted') {
                Alert.alert("Error", "This email has already accepted the invitation!");
                return;
            }
        }

        const inviteDoc = {
            homeId: homeId,
            inviterId: currentUser.email,
            inviterEmail: currentUser.email,
            inviteeEmail: email,
            status: "Pending"
        };

        await db.collection('Invitations').add(inviteDoc);

        setInviteeEmail('');

        Alert.alert("Success", "Invitation sent successfully!");
    };

    const deleteList = (listId) => {
        db.collection('todoLists').doc(listId).delete()
            .then(() => {
                Alert.alert("Success", "Todo List deleted successfully!");
            })
            .catch(error => {
                Alert.alert("Error", error.message);
            });
    };

    const handleSubscriberPress = (subscriber) => {
        setSelectedSubscriber(subscriber);
        setModalVisible(true);
        console.log(subscriber)
    };

    const handleRemoveSubscriber = () => {
        if (selectedSubscriber) {
            // Fetch the current members of the home
            db.collection('homes')
                .doc(homeId)
                .get()
                .then(homeDoc => {
                    if (homeDoc.exists) {
                        const currentMembers = homeDoc.data().members || [];

                        // Remove the subscriber's email from the members array
                        const updatedMembers = currentMembers.filter(memberEmail => memberEmail !== selectedSubscriber.inviteeEmail);

                        // Update the home's members array
                        db.collection('homes')
                            .doc(homeId)
                            .update({ members: updatedMembers })
                            .then(() => {
                                // Now delete the subscriber's invitation
                                db.collection('Invitations')
                                    .doc(selectedSubscriber.id)
                                    .delete()
                                    .then(() => {
                                        Alert.alert("Success", "Subscriber removed successfully.");
                                        setModalVisible(false);
                                     
                                    })
                                    .catch(error => {
                                        Alert.alert("Error", error.message);
                                    });
                            })
                            .catch(error => {
                                Alert.alert("Error", error.message);
                            });
                    } else {
                        Alert.alert("Error", "Home not found.");
                    }
                })
                .catch(error => {
                    Alert.alert("Error", error.message);
                });
        }
    };



    const renderRightActions = (listId) => {
        return (
            <TouchableOpacity onPress={() => deleteList(listId)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {home === null ? (
                // Render a loading indicator or nothing while data is being fetched
                <View>
                    {/* Loading indicator or nothing */}
                </View>
            ) : home.members && home.members.includes(currentUser.email) ? (
                // Render the content when the user has access
                <>
                    <FlatList
                        data={todoLists}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                                <TouchableOpacity onPress={() => navigation.navigate('TodoList', { listId: item.id, homeId: homeId })}>
                                    <View style={styles.card}>
                                        <Text style={styles.title}>{item.name}</Text>
                                        {item.category ? (<Text style={styles.category}>{item.category}</Text>) : (<Text>No Category Defined</Text>)}
                                    </View>
                                </TouchableOpacity>
                            </Swipeable>
                        )}
                    />

                    <FlatList
                        data={subscribers}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleSubscriberPress(item)}>
                                <View style={styles.subscriberItem}>
                                    <Text>{item.inviteeEmail} - {item.status}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />

                    <TextInput
                        placeholder="Enter email to invite"
                        value={inviteeEmail}
                        onChangeText={setInviteeEmail}
                        keyboardType="email-address"
                    />
                    <Button title="Send Invite" onPress={() => sendInvitation(inviteeEmail)} />
                    <Button title="Add Todo List" onPress={() => navigation.navigate('AddList', { homeId })} />

                    <TouchableOpacity onPress={handleDeleteHome} style={styles.deleteButton}>
                        <Text style={styles.deleteText}>Delete Home</Text>
                    </TouchableOpacity>

                    {modalVisible && (
                        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <View style={{ width: '80%', padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
                                <Text style={{ fontWeight:'bold', textAlign: 'center' }}>Do you want to remove {selectedSubscriber?.inviteeEmail} from this home?</Text>
                                <Button title="Remove" onPress={handleRemoveSubscriber} />
                                <Button title="Cancel" onPress={() => setModalVisible(false)} />
                            </View>
                        </View>
                    )}
                </>
            ) : (
                // Render a message when the user does not have access
                <View>
                    <Text>You do not have access to this home.</Text>
                </View>
            )}
        </View>
    );
            
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2, // Added elevation for the raised effect
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    category: {
        fontSize: 12,
        fontStyle: 'italic'
    },
    subscriberItem: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    deleteButton: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
    },
    deleteText: {
        color: 'white',
    }
});

export default HomeDetail;