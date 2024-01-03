import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Alert, Button } from 'react-native';
import { db } from '../firebase/config';
import { format } from 'date-fns';
import { Swipeable } from 'react-native-gesture-handler';
import auth from '@react-native-firebase/auth';


function TodoList({ navigation, route }) {
    const [todos, setTodos] = useState([]);
    const currentUser = auth().currentUser;
    const { homeId, listId } = route.params; // Get the listId from route params

    useEffect(() => {
        const unsubscribe = db.collection('todos')
            .where('listId', '==', listId) // Filter todos by listId
            .onSnapshot(querySnapshot => {
                const todoList = [];
                if (!querySnapshot) { //added
                    console.error("querySnapshot is null");
                    return;
                }

                if (querySnapshot.empty) { //added
                    //console.warn("No documents found");
                    return;
                }
                querySnapshot.forEach(doc => {
                    const todo = {
                        id: doc.id,
                        ...doc.data()
                    };
                    todoList.push(todo);
                });
                setTodos(todoList);
            });

        return () => unsubscribe();
    }, [homeId, listId]);

    useEffect(() => {
        const currentUser = auth().currentUser;
        const unsubscribe = db.collection('homes').doc(homeId)
            .onSnapshot(snapshot => {
                if (snapshot.exists) {
                    const isOwner = snapshot.data().userId === currentUser.email;
                    const members = snapshot.data().members || [];

                    if (isOwner || members.includes(currentUser.email)) {
                        // User has access to the home
                        // You may want to set some state or take other actions if needed
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
    }, [homeId, currentUser, navigation]);

    const deleteTodo = (id) => {
        db.collection('todos').doc(id).delete()
            .then(() => {
                Alert.alert("Success", "Todo deleted successfully!");
                // Remove the deleted task from the todos state
                setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
            })
            .catch(error => {
                Alert.alert("Error", error.message);
            });
    };

    const renderRightActions = (id) => {
        return (
            <TouchableOpacity onPress={() => deleteTodo(id)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={todos}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                        <TouchableOpacity onPress={() => navigation.navigate('TodoDetail', { todoId: item.id, listId: listId, homeId: homeId})}>
                        <View style={[
                                styles.card,
                                {
                                    backgroundColor: item.status === 'Not Started' ? '#FED8B1' : // Soft orange for Not Started
                                                    item.status === 'Pending' ? '#FFFACD' : // Pale yellow for Pending
                                                    item.status === 'Completed' ? 'lightgray' : 'white', // Light gray for Completed
                                },
                            ]}>
                                <Text style={[
                                        styles.title,
                                        {
                                            textDecorationLine: item.status === 'Completed' ? 'line-through' : 'none',
                                        },
                                    ]}>{item.task}</Text>
                                {item.description ? <Text style={styles.description}>Addtional Details: {item.description}</Text> : <Text style={styles.smallMessage}>No additional detail provided.</Text>}
                                <Text style={styles.status}>Status: {item.status}</Text>
                               
                            </View>
                        </TouchableOpacity>
                    </Swipeable>
                )}
            />
            <Button title="Add New Todo" onPress={() => navigation.navigate('AddTodo', { homeId: homeId, listId: listId  })} />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        //backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2, // Added elevation for the raised effect
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    status:{
        fontSize: 14,
    },
    description: {
        fontSize: 14,
        color: 'gray',
    },
    smallMessage: {
        fontSize: 10,
        color: 'gray',
        fontStyle: 'italic'
    },
    date: {
        fontSize: 12,
        color: 'gray',
    },
    deleteButton: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '80%',
    },
    deleteText: {
        color: 'white',
        fontWeight: 'bold',
    }
});

export default TodoList;






