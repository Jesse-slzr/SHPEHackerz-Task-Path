import React, { useEffect, useState } from 'react';
import {
    View,
    Pressable,
    Text,
    Image,
    ActivityIndicator,
    FlatList,
    StyleSheet,
} from 'react-native';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../FirebaseConfig';
import { getDocs, collection } from 'firebase/firestore';
import { useRouter, Link } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';

interface Kid {
    id: string;
    name: string;
    age: number;
    completed: boolean;
}

const KidsSelectionScreen = () => {
    const router = useRouter();
    const [kids, setKids] = useState<Kid[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchKids();
    }, []);

    const fetchKids = async () => {
        try {
            const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'Kids'));
            const fetchedKids = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                age: doc.data().age,
                completed: doc.data().completed,
            }));
            setKids(fetchedKids);
        } catch (error) {
            console.error('Error fetching kids:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderKid = ({ item }: { item: Kid }) => (
        <View style={styles.kidWrapper}>
            <Link
                href={{
                    pathname: '/screens/kidsViewScreens/[id]', 
                    params: { id: item.id, name: item.name },
                }}
                style={styles.kidLink}
            >
                <View style={styles.kidCard}>
                    <FontAwesomeIcon icon={faCircleUser} size={80} color="black" />
                    <Text style={styles.kidName}>{item.name}</Text>
                </View>
            </Link>
        </View>
    );

    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading Kids...</Text>
        </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Exit Button Section */}
            <Pressable
                style={styles.exitButton}
                onPress={() => router.push({pathname:'/screens/dashboardScreens'})}
            >
                <Text style={styles.exitButtonText}>Exit Kids View</Text>
            </Pressable>

            {/* Kid List Section */}
            <FlatList
                data={kids}
                keyExtractor={(item) => item.id}
                renderItem={renderKid}
                contentContainerStyle={styles.kidList}
                ListEmptyComponent={<Text style={styles.emptyText}>No kids found.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#A8D5BA',
        padding: 16,
    },
    exitButton: {
        alignSelf: 'flex-end',
        backgroundColor: '#fff',
        padding: 10,
        marginTop: 48,
        borderRadius: 20,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
    },
    exitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kidList: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    kidWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        margin: 12,
    },
    kidLink: {
        alignItems: 'center',
    },
    kidCard: {
        backgroundColor: '#A3D5BA',
        borderRadius: 10,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    kidAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D9D9D9',
        marginBottom: 8,
    },
    kidName: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#888',
    },
});

export default KidsSelectionScreen;
