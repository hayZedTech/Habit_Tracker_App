import { useAuth } from "@/lib/authcontext";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View, Image } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function AuthPage() {
    const [isSignup, setIsSignup] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [secureText, setSecureText] = useState<boolean>(true); // For the eye toggle
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const { signUp, signIn } = useAuth();
    const theme = useTheme();

    const handleSwitch = () => {
        setIsSignup(prev => !prev);
        setError(null);
    }

    const handleSubmit = async () => {
        if (!email || !password) {
            setError("Fields cannot be empty!");
            return;
        }

        if (password.length < 8) {
            setError("Password must be minimum of 8 characters long!")
            return;
        }

        setLoading(true);
        setError(null);

        let resultError;
        if (isSignup) {
            resultError = await signUp(email, password);
        } else {
            resultError = await signIn(email, password);
        }

        if (resultError) {
            setError(resultError);
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS == "ios" ? "padding" : "height"}
        >
            <View style={styles.card}>
                <View style={styles.headerIcon}>
                    <MaterialCommunityIcons 
                        name={isSignup ? "account-plus" : "lock-reset"} 
                        size={50} 
                        color="#2E7D32" 
                    />
                </View>

                <Text style={styles.title} variant="headlineMedium">
                    {isSignup ? "Create Account" : "Welcome Back"}
                </Text>
                
                <Text style={styles.subtitle}>
                    {isSignup ? "Start your journey to better habits today." : "Log in to track your daily progress."}
                </Text>

                <TextInput 
                    onChangeText={setEmail} 
                    style={styles.inputs} 
                    label="Email" 
                    autoCapitalize="none" 
                    keyboardType="email-address"
                    placeholder="example@gmail.com" 
                    mode="outlined" 
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="email-outline" />}
                />

                <TextInput 
                    onChangeText={setPassword} 
                    style={styles.inputs} 
                    label="Password" 
                    autoCapitalize="none" 
                    secureTextEntry={secureText} 
                    mode="outlined" 
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                        <TextInput.Icon 
                            icon={secureText ? "eye" : "eye-off"} 
                            onPress={() => setSecureText(!secureText)} 
                        />
                    }
                />

                {error && (
                    <View style={styles.errorBox}>
                        <MaterialCommunityIcons name="alert-circle" size={16} color="red" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <Button 
                    onPress={handleSubmit} 
                    style={styles.mainButton} 
                    mode="contained"
                    loading={loading}
                    disabled={loading}
                    contentStyle={{ paddingVertical: 6 }}
                    labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
                >
                    {isSignup ? "Sign Up" : "Sign In"}
                </Button>

                <Button 
                    onPress={handleSwitch} 
                    style={styles.switchButton} 
                    mode="text"
                    textColor="#666"
                >
                    {isSignup ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </Button>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#F2F2F7", // Match overall app background
    },
    card: {
        backgroundColor: "#fff",
        padding: 25,
        borderRadius: 30,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    headerIcon: {
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
        fontSize: 14,
    },
    inputs: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    inputOutline: {
        borderRadius: 15,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        justifyContent: 'center',
        marginBottom: 10,
    },
    errorText: {
        color: "red",
        fontSize: 13,
        fontWeight: '600'
    },
    mainButton: {
        marginTop: 10,
        borderRadius: 15,
        backgroundColor: "#2E7D32", // Match your green theme
    },
    switchButton: {
        marginTop: 5,
    }
});