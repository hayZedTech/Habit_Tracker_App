import { client, COLLECTION_ID, DATABASE_ID, databases, FetchStream, LOG_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/authcontext";
import { Habit } from "@/types/database.type";
import React, { useEffect, useState, useRef } from "react";
import { ScrollView, StyleSheet, Text, View, Alert, Dimensions } from "react-native";
import { Query } from "react-native-appwrite";
import { Button } from "react-native-paper";
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { GestureHandlerRootView, RectButton } from 'react-native-gesture-handler';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

export default function Index() {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>();

  const swipeableRefs = useRef<Record<string, React.RefObject<SwipeableMethods | null>>>({});
  const processingRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      const channel = `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`;
      const habitStream = client.subscribe(channel, (response: FetchStream) => {
        if (
          response.events.includes("databases.*.collections.*.documents.*.create") ||
          response.events.includes("databases.*.collections.*.documents.*.update") ||
          response.events.includes("databases.*.collections.*.documents.*.delete")
        ) {
          fetchHabit();
        }
      });

      fetchHabit();
      return () => habitStream();
    }
  }, [user]);

  const fetchHabit = async () => {
    try {
      const response = await databases.listDocuments<Habit>(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );
      setHabits(response.documents);
    } catch (error) {
      console.error(error);
    }
  };

  const handleComplete = async (habit: Habit) => {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    swipeableRefs.current[habit.$id]?.current?.close();

    try {
      const existingLog = await databases.listDocuments(
        DATABASE_ID,
        LOG_COLLECTION_ID,
        [
          Query.equal("habit_id", habit.$id),
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", startOfToday.toISOString()),
          Query.lessThan("completed_at", startOfTomorrow.toISOString()),
          Query.limit(1),
        ]
      );

      if (existingLog.total > 0) {
        Alert.alert("Already Paid 🔥", "Today is one streak pay day.\nCome back tomorrow.");
        return;
      }

      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, habit.$id, {
        streak_count: (habit.streak_count || 0) + 1,
        last_completed: startOfToday.toISOString().split("T")[0],
      });

      await databases.createDocument(
        DATABASE_ID,
        LOG_COLLECTION_ID,
        "unique()",
        {
          user_id: user?.$id,
          habit_id: habit.$id,
          habit_title: habit.title,
          completed_at: now.toISOString(),
        }
      );

      fetchHabit();
    } catch (error) {
      console.error("Failed to complete habit:", error);
      Alert.alert("Error", "Could not save your progress. Please try again.");
    }
  };

  const handleDelete = (habitId: string) => {
    Alert.alert("Delete Habit", "Are you sure?", [
      { text: "Cancel", style: "cancel", onPress: () => swipeableRefs.current[habitId]?.current?.close() },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          swipeableRefs.current[habitId]?.current?.close();
          try {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, habitId);
            fetchHabit();
          } catch (error) {
            console.error("Delete failed:", error);
          }
        }
      },
    ]);
  };

  const renderRightActions = (id: string) => (
    <RectButton style={styles.deleteAction} onPress={() => handleDelete(id)}>
      <MaterialCommunityIcons name="delete-outline" size={28} color="#fff" />
    </RectButton>
  );

  const renderLeftActions = (habit: Habit) => (
    <RectButton style={styles.completeAction} onPress={() => handleComplete(habit)}>
      <MaterialCommunityIcons name="check-decagram" size={28} color="#fff" />
    </RectButton>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.heading}>
          <Text style={styles.headingTitle}>Today's Habit</Text>
          <Button buttonColor="red" icon="logout" textColor="white" onPress={logout} mode="text" labelStyle={{ fontWeight: 'bold' }}>
            Logout
          </Button>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.miniContainer}>
            {habits?.map((habit) => {
              const today = new Date().toISOString().split("T")[0];
              const isDoneToday = habit.last_completed === today;

              if (!swipeableRefs.current[habit.$id]) {
                swipeableRefs.current[habit.$id] = React.createRef<SwipeableMethods>();
              }

              return (
                <View key={habit.$id} style={styles.cardWrapper}>
                  <Swipeable
                    ref={swipeableRefs.current[habit.$id]}
                    renderRightActions={() => renderRightActions(habit.$id)}
                    renderLeftActions={() => !isDoneToday ? renderLeftActions(habit) : null}
                    friction={2}
                  >
                    <View style={[styles.habitsContainer, isDoneToday && styles.completedCard]}>
                      <View style={styles.habitMainInfo}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.habitTitle, isDoneToday && styles.strikeText]}>
                            {habit.title}
                          </Text>
                          <Text style={styles.habitDescription}>{habit.description}</Text>
                        </View>
                        {isDoneToday && (
                          <MaterialCommunityIcons name="checkbox-marked-circle" size={26} color="#4CAF50" />
                        )}
                      </View>

                      <View style={styles.habitStreakFreqContainer}>
                        <View style={styles.habitStreak}>
                          <MaterialCommunityIcons 
                            name="fire" 
                            size={22} 
                            color={isDoneToday ? "#BDBDBD" : "#FF5722"} 
                          />
                          <Text style={[styles.streakCountText, { color: isDoneToday ? "#BDBDBD" : "#FF5722" }]}>
                            {habit.streak_count} day streak
                          </Text>
                        </View>
                        <View style={styles.freqBadge}>
                          <Text style={styles.freqText}>
                            {habit.frequency ? habit.frequency[0].toUpperCase() + habit.frequency.slice(1) : ""}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Swipeable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#F2F2F7' }, // Apple-style light gray background
  miniContainer: { paddingBottom: 20 },
  heading: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: 15,
    marginTop: 10,
    paddingHorizontal: 8 
  },
  cardWrapper: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden', // Keeps swipe actions rounded
    backgroundColor: '#fff',
    // Stronger Shadow Logic
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4.65,
    elevation: 6,
  },
  habitsContainer: {
    backgroundColor: "#fff",
    padding: 18,
  },
  completedCard: { backgroundColor: "#F9F9F9", opacity: 0.8 },
  habitMainInfo: { flexDirection: 'row', alignItems: 'center' },
  headingTitle: { fontSize: 28, fontWeight: "900", color: '#1C1C1E' },
  habitTitle: { fontSize: 19, fontWeight: "700", color: '#2C2C2E' },
  strikeText: { textDecorationLine: 'line-through', color: '#8E8E93' },
  habitDescription: { fontSize: 14, color: '#636366', marginTop: 4, lineHeight: 18 },
  habitStreakFreqContainer: { marginTop: 18, flexDirection: "row", justifyContent: "space-between", alignItems: 'center' }, 
  habitStreak: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakCountText: { fontWeight: '700', fontSize: 15 },
  freqBadge: { backgroundColor: 'rgba(76, 175, 80, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  freqText: { color: "#2E7D32", fontWeight: "800", fontSize: 12, textTransform: 'uppercase' },
  deleteAction: { backgroundColor: "#FF3B30", justifyContent: "center", alignItems: "center", width: 90 },
  completeAction: { backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center", width: 90 },
});