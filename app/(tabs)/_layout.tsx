import { Tabs } from "expo-router";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabsLayout() {
  return(
    <Tabs screenOptions={{tabBarActiveTintColor:"seagrbleen"}}>
      <Tabs.Screen name="index" options={{title:"Today's Habit", headerTitleAlign:"center", tabBarIcon:({color, size})=><MaterialCommunityIcons name="calendar-check" size={size + 4} color={color} />}} />
       <Tabs.Screen name="addhabit" options={{title:"Add Habit", headerTitleAlign:"center", tabBarIcon:({color, size})=><MaterialCommunityIcons name="plus-circle" size={size + 5} color={color} />}} />
       <Tabs.Screen name="streak" options={{title:"Streaks", headerTitleAlign:"center", tabBarIcon:({color, size})=><MaterialCommunityIcons name="fire" size={size + 5} color="black" />}} />
    </Tabs>
  ) 
}
