import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './src/screens/Login';
import HomeList from './src/screens/HomeList';
import HomeDetail from './src/screens/HomeDetail';
import AddTodo from './src/screens/AddTodo';
import AddList from './src/screens/AddList';
import Register from './src/screens/Register';
import TodoDetail from './src/screens/TodoDetail';
import TodoList from './src/screens/TodoList';


const Stack = createStackNavigator();


export default function App() {


    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Login" component={Login}/>
                <Stack.Screen name="Register" component={Register}/>
                <Stack.Screen name="HomeList" component={HomeList} options={{ headerTitle: 'All Homes' }}/>
                <Stack.Screen name="HomeDetail" component={HomeDetail} options={{ headerTitle: 'All Lists' }}/>
                <Stack.Screen name="AddTodo" component={AddTodo} options={{ headerTitle: 'Add A Todo' }} />
                <Stack.Screen name="AddList" component={AddList} options={{ headerTitle: 'Add A List' }}/>
                <Stack.Screen name="TodoDetail" component={TodoDetail} options={{ headerTitle: 'Todo Detail' }}/>
                <Stack.Screen name="TodoList" component={TodoList} options={{ headerTitle: 'Todos' }}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
}
