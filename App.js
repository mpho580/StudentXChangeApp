import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainTabs from './navigation/MainTabs';
import ListingDetailsScreen from './screens/ListingDetailsScreen';
import MyListingsScreen from './screens/MyListingsScreen';
import CreateListingScreen from './screens/CreateListingScreen';
import SearchScreen from './screens/SearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';
import InboxScreen from './screens/InboxScreen';
import ChatScreen from './screens/ChatScreen';
import EditListingScreen from './screens/EditListingScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    

        {/* Main app shell (bottom tabs) */}
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* Extra screens on top of tabs */}
        <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
        <Stack.Screen name="MyListings" component={MyListingsScreen} />
        <Stack.Screen name="CreateListing" component={CreateListingScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="EditListing" component={EditListingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}