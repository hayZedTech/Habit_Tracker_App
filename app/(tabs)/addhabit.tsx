import { COLLECTION_ID, DATABASE_ID, databases } from "@/lib/appwrite";
import { useAuth } from "@/lib/authcontext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View, ScrollView } from "react-native";
import { ID } from "react-native-appwrite";
import { Button, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const FREQUENCIES = ["daily", "weekly", "monthly"];
type frequency = (typeof FREQUENCIES[number]);

export default function ProfileScreen() {
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [frequency, setFrequency] = useState<frequency>("daily");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const { user } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    const handleAddHabit = async () => {
        setLoading(true);
        setError(null);
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                user_id: user?.$id,
                title,
                description,
                streak_count: 0,
                frequency,
                last_completed: ""
            });
            router.back();
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                console.error(error);
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <View style={styles.iconHeader}>
                        <MaterialCommunityIcons name="target" size={40} color={theme.colors.primary} />
                    </View>
                    
                    <Text variant="headlineSmall" style={styles.title}>New Habit</Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>What do you want to achieve today?</Text>

                    <View style={styles.inputGroup}>
                        <TextInput 
                            label="Habit Title" 
                            mode="outlined" 
                            placeholder="e.g. Read 10 Pages"
                            onChangeText={setTitle} 
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                        />
                        <TextInput 
                            label="Description" 
                            mode="outlined" 
                            placeholder="Why is this important?"
                            onChangeText={setDescription} 
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text variant="labelLarge" style={styles.label}>Frequency</Text>
                        <SegmentedButtons 
                            style={styles.freqButtons}
                            value={frequency}
                            density="medium"
                            buttons={FREQUENCIES.map((freq) => ({
                                value: freq,
                                label: freq[0].toUpperCase() + freq.slice(1),
                                labelStyle: { fontWeight: '600' }
                            }))}
                            onValueChange={(value) => setFrequency(value as frequency)}
                        />
                    </View>

                    {error && (
                        <View style={styles.errorContainer}>
                            <MaterialCommunityIcons name="alert-circle" size={16} color={theme.colors.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <Button 
                        onPress={handleAddHabit} 
                        mode="contained" 
                        loading={loading}
                        disabled={!title || !description || loading}
                        style={styles.addButton}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.buttonLabel}
                    >
                        Create Habit
                    </Button>

                    <Button 
                        onPress={() => router.back()} 
                        mode="text" 
                        textColor="#8E8E93"
                        style={styles.cancelButton}
                    >
                        Cancel
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F2F7", // Match the background color of your main page
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
    },
    card: {
        backgroundColor: "#fff",
        padding: 24,
        borderRadius: 28, // Modern extra-rounded corners
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    iconHeader: {
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        textAlign: "center",
        fontWeight: "900",
        color: "#1C1C1E",
    },
    subtitle: {
        textAlign: "center",
        color: "#8E8E93",
        marginBottom: 25,
    },
    inputGroup: {
        gap: 15,
        marginBottom: 20,
    },
    input: {
        backgroundColor: "#fff",
    },
    inputOutline: {
        borderRadius: 12,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        color: "#1C1C1E",
        fontWeight: "700",
        marginLeft: 4,
    },
    freqButtons: {
        marginVertical: 5,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 15,
        justifyContent: 'center'
    },
    errorText: {
        color: "#D32F2F",
        fontSize: 14,
        fontWeight: "500",
    },
    addButton: {
        borderRadius: 12,
        marginTop: 10,
        backgroundColor: '#4CAF50', // Matching your "Complete" button color
    },
    buttonContent: {
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: "800",
    },
    cancelButton: {
        marginTop: 5,
    }
})