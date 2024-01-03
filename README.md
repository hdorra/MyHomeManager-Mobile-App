
# MyHomeManager - Mobile App 
Full-stack React Native/Firebase app for managing multiple homes with subscribed members (for IOS and Android Platforms).

## Summary
"MyHomeManager" streamlines daily tasks and promotes group management:
- It supports multiple homes or groups for families, roommates, coworkers, and event organizers.
- Users can create and manage multiple lists for various purposes.
- The app offers real-time collaboration on tasks and lists.
- It utilizes a cloud backend for data synchronization and access across devices.

## Features
### 1.Login screen:

>Demo - Creating A Username And Password

https://github.com/hdorra/MyHomeManager-Mobile-App/assets/13279722/be1643a4-25e6-4ee3-83df-cff0705dbd81

### 2. Create multiple "homes"​ or groups: </br>
A home could be a group of classmates working on a project together, a family (parents/siblings, etc), a special event that requires collaboration and multiples lists with multiple tasks each that need to be assigned to different "home members." </br>

>Demo - Creating Multiple Lists Per Home

https://github.com/hdorra/MyHomeManager-Mobile-App/assets/13279722/71e0e8fb-00df-41fb-bbf3-d6f07a34229f

>Demo - Creating Multiple Tasks Per List & Update/Delete A Task

https://github.com/hdorra/MyHomeManager-Mobile-App/assets/13279722/2522368e-5f5c-47ff-8a91-b91d50639e59

>Demo - Chat between members within task details

https://github.com/hdorra/MyHomeManager-Mobile-App/assets/13279722/74f80739-20ec-44bf-8420-9db645429b4f

### 3. Member Subscription Model​
- Invite via email members to this home and assign tasks to them.​
- A member can unsubscribe themselves if they no longer want to be a member of the home.​
- Send email invites to members to join that home. ​
- See the status of that invite as pending or accepted. ​
- Can click on the name and unsubscribe them from a home and won't lose historical information from that user.​

>Demo - Adding A Member:

https://github.com/hdorra/MyHomeManager-Mobile-App/assets/13279722/c0641364-f655-4b1a-8ab0-828845c426b9

>Demo - Removing A Member:

https://github.com/hdorra/MyHomeManager-Mobile-App/assets/13279722/a6050f09-b1fe-492a-9246-289375840008

>Demo - Member Unsubscribing:

https://github.com/hdorra/MyHomeManager-Mobile-App/assets/13279722/95f89f6c-86cf-42c7-9ea3-57f544d16449

### 4. Easy to use interface​
- Homes:​
>All homes in one screen: tap on the home to navigate to its details.​
>Swiping functionality to delete homes if you created them.​
>Members invited to a home cannot delete a home but can unsubscribe with a swipe as well.​
- Lists:​
>Create multiple lists within a home.​
- Tasks & Task Detail:​
>List of all tasks (or todos) per list. ​
>Color coding to easily recognize status​
>Interact with comments with the members on assigned tasks.​
>Upload multiple images per task.​
>Assign due dates to stay on track.​
<img width="700" alt="image" src="https://github.com/hdorra/MyHomeManager-Mobile-App/assets/13279722/8dad9e8a-2a46-42a7-836b-8002fec4f651">

## How To Use 
### Important: Firebase Backend-Integration

This is a [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

A new Firebase project will need to be created and integrated for both Apple and Android platforms:

- [Apple Platform](https://firebase.google.com/docs/ios/setup)
- [Android Platform](https://firebase.google.com/docs/android/setup)

#### Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
