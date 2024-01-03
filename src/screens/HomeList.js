import React, { useState, useEffect } from 'react';
import { Alert, View, Text, TextInput, FlatList, StyleSheet, Button, TouchableOpacity, Modal } from 'react-native';
import { db } from '../firebase/config';
import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';
import { Swipeable } from 'react-native-gesture-handler';


function HomeList({ navigation }) {
    const [homes, setHomes] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(!!auth().currentUser);
    const [showModal, setShowModal] = useState(false);
    const [selectedInvite, setSelectedInvite] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [homeName, setHomeName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [previousHomes, setPreviousHomes] = useState([]);
    
    useEffect(() => {
        const currentUser = auth().currentUser;
        if (!currentUser) {
            console.log("No user is currently logged in!");
            setHomes([]);
            return;
        }

        const unsubscribeHomes = db.collection('homes')
            .where('members', 'array-contains', currentUser.email)
            .onSnapshot(snapshot => {
                console.log('Homes Snapshot:', snapshot.docs); // Log the snapshot
                if (snapshot.empty) {
                    console.log("No Homes Yet.")
                    // Handle the case when there are no documents in the collection
                    setHomes([]);
                    return;
                }
                const fetchedHomes = snapshot.docs.map(doc => {
                    console.log(currentUser.email)
                    console.log('homes')
                    return { id: doc.id, ...doc.data() };
                });
                setHomes(fetchedHomes);
            });

        const unsubscribeInvites = db.collection('Invitations')
            .where('inviteeEmail', '==', currentUser.email)
            .where('status', '==', 'Pending')
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    // Handle the case when there are no documents in the collection
                    return;
                }
                const fetchedInvites = snapshot.docs.map(doc => {
                    return {
                        id: doc.id,
                        ...doc.data(),
                        name: "Invitation from: " + doc.data().inviterId
                    };
                });
                setHomes(prevHomes => [...prevHomes, ...fetchedInvites]);
            });

        return () => {
            unsubscribeHomes();
            unsubscribeInvites();
        };
    }, [isLoggedIn, navigation]);

    useEffect(() => {
        const unsubscribe = db.collection('homes')
            .onSnapshot(snapshot => {
                const newHomes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (previousHomes.length > newHomes.length) {
                    const deletedHome = previousHomes.find(
                        prevHome => !newHomes.some(newHome => newHome.id === prevHome.id)
                    );

                    if (deletedHome && deletedHome.userId === auth().currentUser.email) {
                        if (isDeleting) {
                            Alert.alert('Notification', 'Home successfully deleted.');
                            setIsDeleting(false);
                        } else {
                            Alert.alert('Notification', 'Home no longer found - deleted.');
                        }
                    }
                }

                setPreviousHomes(newHomes);
            });

        return () => {
            unsubscribe();
        };
    }, [isDeleting, previousHomes]);

    const handleCreateHome = () => {
        const currentUser = auth().currentUser;
        if (!currentUser) {
            Alert.alert("Error", "You must be logged in to create a home!");
            return;
        }

        db.collection('homes').add({
            name: homeName,
            userId: currentUser.email,
            members: [currentUser.email]
        })
            .then(() => {
                setHomeName('');
                setShowCreateModal(false);

            })
            .catch(error => {
                Alert.alert("Error", error.message);
            });

    };

    const handleDeleteHome = (homeId) => {
        setIsDeleting(true);
        deleteHome(homeId);
    };

    const deleteHome = (homeId) => {
        db.collection('homes').doc(homeId).delete()
            .then(() => {
                //Alert.alert("Success", "Home deleted successfully!");
            })
            .catch(error => {
                Alert.alert("Error", error.message);
            })
          
    };

    const handleInviteDecline = async () => {
        await db.collection('Invitations').doc(selectedInvite.id).update({
            status: 'Declined'
        });

        setHomes(prevHomes => prevHomes.filter(home => home.id !== selectedInvite.id));

        setShowModal(false);
    };

    const handleUnsubscribe = async (homeId) => {
        const currentUser = auth().currentUser;
        if (!currentUser) {
            Alert.alert("Error", "You must be logged in to unsubscribe!");
            return;
        }

        // Remove the user from the members array of the home
        await db.collection('homes').doc(homeId).update({
            members: firebase.firestore.FieldValue.arrayRemove(currentUser.email),
        });

        // Remove the home from the homes list
        setHomes(prevHomes => prevHomes.filter(home => home.id !== homeId));

        // Remove the invitation by updating the status and then deleting the document
        await db.collection('Invitations')
            .where('homeId', '==', homeId)
            .where('inviteeEmail', '==', currentUser.email)
            .get()
            .then(querySnapshot => {
                querySnapshot.forEach(doc => {
                    // Update the invitation status
                    db.collection('Invitations').doc(doc.id).update({
                        status: 'Unsubscribed'
                    })
                        .then(() => {
                            // Delete the invitation document
                            db.collection('Invitations').doc(doc.id).delete()
                                .then(() => {
                                    Alert.alert("Success", "Unsubscribed successfully!");
                                })
                                .catch(error => {
                                    Alert.alert("Error", error.message);
                                });
                        })
                        .catch(error => {
                            Alert.alert("Error", error.message);
                        });
                });
            })
            .catch(error => {
                Alert.alert("Error", error.message);
            });
    };



    const renderRightActions = (homeId, userId) => {
        const currentUser = auth().currentUser;
        if (currentUser && userId === currentUser.email) {
            return (
                <TouchableOpacity onPress={() => handleDeleteHome(homeId)} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            );
        } else {
            return (
                <TouchableOpacity onPress={() => Alert.alert("Alert", "You cannot delete this home.")} style={styles.noDeleteButton}>
                    <Text style={styles.noDeleteText}>Can't Delete</Text>
                </TouchableOpacity>
            );
        }
    };

    const renderLeftActions = (homeId, userId) => {
        const currentUser = auth().currentUser;

        if (currentUser && userId !== currentUser.email) {
            return (
                <TouchableOpacity onPress={() => handleUnsubscribe(homeId)} style={styles.unsubscribeButton}>
                    <Text style={styles.unsubscribeText}>Unsubscribe</Text>
                </TouchableOpacity>
            );
        } else {
            return null; // No left action if user is the owner
        }
    };


    const handleInviteAccept = async () => {
        await db.collection('Invitations').doc(selectedInvite.id).update({
            status: 'Accepted'
        });
        await db.collection('homes').doc(selectedInvite.homeId).update({
            members: firebase.firestore.FieldValue.arrayUnion(auth().currentUser.email)
        });
        setHomes(prevHomes => prevHomes.filter(home => home.id !== selectedInvite.id));
        setShowModal(false);
    };


    return (
         <View style={styles.container}>
            {homes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text>No homes added yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={homes}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <Swipeable renderRightActions={() => renderRightActions(item.id, item.userId, item.members)} renderLeftActions={() => renderLeftActions(item.id, item.userId)}>
                            <TouchableOpacity onPress={() => {
                                if (item.status === 'Pending') {
                                    setSelectedInvite(item);
                                    setShowModal(true);
                                } else {
                                    // Navigate to HomeDetail with homeId as a parameter
                                    console.log(item.id)
                                    navigation.navigate('HomeDetail', { homeId: item.id });
                                }
                            }}>
                                <View style={styles.card}>
                                    <Text style={styles.title}>{item.name}</Text>
                                </View>
                            </TouchableOpacity>
                        </Swipeable>
                    )}
                    />
            )}
            <Button title="+ ADD Home" onPress={() => setShowCreateModal(true)} />
            <Modal
                visible={showCreateModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            value={homeName}
                            onChangeText={setHomeName}
                            placeholder="Home Name"
                            style={styles.input}
                        />
                        <Button title="Create Home" onPress={handleCreateHome} />
                        <Button title="Cancel" onPress={() => setShowCreateModal(false)} />
                    </View>
                </View>
            </Modal>
            <Modal visible={showModal} transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontWeight:'bold', textAlign: 'center' }}>Do you want to accept the invitation from {selectedInvite?.inviterId}?</Text>
                        <Button title="Accept" onPress={handleInviteAccept} />
                        <Button title="Decline" onPress={handleInviteDecline} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 5,
        elevation: 2, // Added elevation for the raised effect
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 20,
        marginBottom: 10
    },
    modalContent: {
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
    },
    input: {
        marginVertical: 10,
        padding: 10,
        borderColor: 'gray',
        borderWidth: 1,
        width: '100%',
    },
    deleteButton: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '80%'
    },
    deleteText: {
        color: 'white',
        fontWeight: 'bold'
    },
    noDeleteButton: {
        backgroundColor: 'gray',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '80%'
    },
    noDeleteText: {
        color: 'white',
        fontWeight: 'bold'
    },
    unsubscribeButton: {
        backgroundColor: 'orange',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '80%'
    },
    unsubscribeText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default HomeList;