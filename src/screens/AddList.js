import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { db } from '../firebase/config';
import { firebase } from '@react-native-firebase/app'; 

function AddList({ route, navigation }) {
    const { homeId } = route.params;
    const [listName, setListName] = useState('');
    const [category, setCategory] = useState('');

    const handleCreateList = () => {
        db.collection('todoLists').add({
            name: listName,
            category: category,
            homeId: homeId,
            
        })
            .then(() => {
                Alert.alert("Success", "List created successfully!");
                navigation.goBack();
            })
            .catch(error => {
                alert(error.message);
            });
    };

    return (
        <View style={styles.container}>
            <TextInput
                value={listName}
                onChangeText={setListName}
                placeholder="List Name"
                style={styles.input}
            />
            <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Category"
                style={styles.input}
            />
            <Button title="Create List" onPress={handleCreateList} />
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
});

export default AddList;