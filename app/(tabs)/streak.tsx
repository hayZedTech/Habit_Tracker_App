import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from "react-native";
import { databases, DATABASE_ID, LOG_COLLECTION_ID, COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/authcontext";
import { Query } from "react-native-appwrite";
import { BarChart } from "react-native-chart-kit";
import { useFocusEffect } from "expo-router";

const { width } = Dimensions.get("window");

interface HabitStreak {
  name: string;
  currentStreak: number;
  totalCompletions: number;
  color: string;
}

export default function StreakPage() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [habitStreaks, setHabitStreaks] = useState<HabitStreak[]>([]);
  const [globalStats, setGlobalStats] = useState({ total: 0, bestStreak: 0 });
  const [weeklyActivity, setWeeklyActivity] = useState([0, 0, 0, 0, 0, 0, 0]);

  const fetchDetailedStats = async () => {
    if (!user?.$id) return;
    
    try {
      const [habitRes, logRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
          Query.equal("user_id", user.$id),
          Query.limit(100),
        ]),
        databases.listDocuments(DATABASE_ID, LOG_COLLECTION_ID, [
          Query.equal("user_id", user.$id),
          Query.orderDesc("completed_at"),
          Query.limit(2000)
        ])
      ]);

      const allLogs = logRes.documents;
      const habits = habitRes.documents;

      const todayStr = new Date().toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      const calculatedStreaks = habits.map((habit) => {
        const habitLogs = allLogs
          .filter(log => log.habit_id === habit.$id)
          .map(log => new Date(log.completed_at).toDateString());
        
        const uniqueDates = new Set(habitLogs);
        let streak = 0;

        if (uniqueDates.has(todayStr) || uniqueDates.has(yesterdayStr)) {
          let tempDate = uniqueDates.has(todayStr) ? new Date() : yesterday;
          while (uniqueDates.has(tempDate.toDateString())) {
            streak++;
            tempDate.setDate(tempDate.getDate() - 1);
          }
        }

        return {
          name: habit.title || "Unnamed",
          currentStreak: streak,
          totalCompletions: uniqueDates.size,
          color: habit.color || "#6200ee"
        };
      });

      setHabitStreaks(calculatedStreaks);
      setGlobalStats({
        total: logRes.total,
        bestStreak: Math.max(...calculatedStreaks.map(s => s.currentStreak), 0)
      });

      const weeklyData = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(new Date().getDate() - (6 - i));
        weeklyData[i] = allLogs.filter(log => new Date(log.completed_at).toDateString() === d.toDateString()).length;
      }
      setWeeklyActivity(weeklyData);

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      fetchDetailedStats();
    }, [user?.$id])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetailedStats();
  }, [user?.$id]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#000"
            colors={["#000"]}
            progressViewOffset={20}
          />
        }
      >
        <Text style={styles.header}>Your Momentum</Text>

        <View style={styles.heroRow}>
          <View style={styles.mainStat}>
            <Text style={styles.statNumber}>{globalStats.total}</Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
          <View style={styles.mainStat}>
            <Text style={styles.statNumber}>{globalStats.bestStreak}d</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Active Streaks 🔥</Text>
        
        {habitStreaks.length === 0 && !refreshing ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No habits found. Swipe down to refresh!</Text>
          </View>
        ) : (
          habitStreaks.map((habit, index) => (
            <View key={index} style={styles.habitCard}>
              <View style={[styles.accentBar, { backgroundColor: habit.color }]} />
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitSub}>{habit.totalCompletions} check-ins</Text>
              </View>
              <View style={[styles.streakBadge, { backgroundColor: habit.currentStreak > 0 ? '#000' : '#E0E0E0' }]}>
                <Text style={styles.streakText}>{habit.currentStreak}d</Text>
              </View>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Daily Activity</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: ["M", "T", "W", "T", "F", "S", "S"],
              datasets: [{ data: weeklyActivity }]
            }}
            width={width - 70}
            height={200}
            fromZero={true}
            yAxisLabel="" // Mandatory prop fixed
            yAxisSuffix="" // Mandatory prop fixed
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              barPercentage: 0.5,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 32, fontWeight: "900", marginBottom: 25, color: "#1A1A1A", marginTop: 50, textAlign:"center" },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  mainStat: { 
    backgroundColor: '#fff', 
    width: (width - 55) / 2, 
    padding: 20, 
    borderRadius: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10
  },
  statNumber: { fontSize: 32, fontWeight: '900', color: '#000' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#888', marginTop: 5, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 15, color: "#1A1A1A" },
  habitCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5
  },
  accentBar: { width: 5, height: 35, borderRadius: 10, marginRight: 15 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  habitSub: { fontSize: 12, color: '#999', marginTop: 2 },
  streakBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  streakText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  chartContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 15, elevation: 2, marginBottom: 20 },
  chart: { marginLeft: -15 },
  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 20 },
  emptyText: { color: '#999', fontWeight: '600' }
});