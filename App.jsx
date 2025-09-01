import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import Voice from "@react-native-voice/voice";
import Icon from "react-native-vector-icons/MaterialIcons";

const App = () => {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const materialData = [
    "MuuchStac Growth Pure",
    "10 mm tempered glass",
    "1.2mm RR Electrical Case",
    "10 A Single Pole MCB Switch Gear",
    "1600A TP ACB Draw Out Type",
    "IT Consultation",
    "DM0000011",
  ];

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/\s+/g, " ")   // normalize spaces
      .trim();
  };
  
  const filteredData = materialData.filter((item) => {
    const itemText = normalizeText(item);
    const queryWords = normalizeText(query).split(" ");
  
    // ✅ every word typed/spoken must exist in item text
    return queryWords.every((word) => itemText.includes(word));
  });

  // 🎤 Setup listeners
  useEffect(() => {
    Voice.onSpeechStart = () => {
      setIsListening(true);
      setStatusMessage("Listening...");
    };
    Voice.onSpeechEnd = () => {
      setIsListening(false);
      setStatusMessage("Processing...");
    };
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setQuery(e.value[0]);
        setStatusMessage("");
      }
    };
    Voice.onSpeechError = (e) => {
      setIsListening(false);
      setStatusMessage("Error: Try again");
      console.log("Speech error:", e);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // 🎤 Permission request
  const requestPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startListening = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert("Permission Required", "Please enable microphone access.");
      return;
    }
    try {
      setQuery("");
      setStatusMessage("Starting...");
      await Voice.start("en-US");
    } catch (e) {
      console.error("Start error:", e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      setStatusMessage("");
    } catch (e) {
      console.error("Stop error:", e);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <Text style={styles.title}>Material List</Text>

      <View style={styles.searchContainer}>
        <View style={{ flex: 1, position: "relative" }}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search fruits..."
          />
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setQuery("")}
            >
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.micButton, { backgroundColor: isListening ? "#f44336" : "#007AFF" }]}
          onPress={isListening ? stopListening : startListening}
        >
          <Text style={{ color: "white", fontSize: 18 }}>
            {/* {isListening ? "⏹" : "🎤"} */}
            {isListening ? (
              <Icon name="stop" size={22} color="white" />
            ) : (
              <Icon name="mic" size={22} color="white" />
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}

      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No materials found for "{query}"</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  searchContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  clearButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  micButton: {
    marginLeft: 10,
    padding: 12,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  status: { textAlign: "center", color: "#007AFF", marginBottom: 10 },
  item: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderRadius: 8,
    marginVertical: 4,
  },
  itemText: { fontSize: 16 },
  emptyText: { textAlign: "center", color: "#666", fontSize: 16, marginTop: 20 },
});

export default App;