import React, { useEffect, useState } from 'react';
import {
    View,
    Pressable,
    Text,
    ActivityIndicator,
    FlatList,
    StyleSheet,
} from 'react-native';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../FirebaseConfig';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { useRouter, Link } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGear, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface Kid {
    docId: string;
    kidId: string;
    name: string;
    age: number;
    completed: boolean;
}

const KidsSelectionScreen = () => {
    const router = useRouter();
    const [kids, setKids] = useState<Kid[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is authenticated, fetch kids with valid UID
                fetchKids(user.uid);
            } else {
                // User is not authenticated, set empty state
                console.log('No authenticated user found');
                setKids([]);
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const fetchKids = async (parentUuid: string) => {
        try {
            if (!parentUuid) {
                console.error('Invalid parentUuid:', parentUuid);
                setKids([]);
                setLoading(false);
                return;
            }

            const querySnapshot = await getDocs(
                query(collection(FIRESTORE_DB, 'Kids'), where('parentUuid', '==', parentUuid))
            );
            const fetchedKids: Kid[] = querySnapshot.docs.map((doc) => ({
                kidId: doc.data().kidId,
                ...doc.data(),
                docId: doc.id
            } as Kid));
            setKids(fetchedKids);
        } catch (error) {
            console.error('Error fetching Kids:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderKid = ({ item }: { item: Kid }) => (
        <View style={styles.kidWrapper}>
            <Link
                href={{
                    pathname: '/screens/kidsViewScreens/[id]', 
                    params: { id: item.kidId, name: item.name },
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
            <ActivityIndicator size="large" color="#A8D5BA" />
            <Text>Loading Kids...</Text>
        </View>
        );
    }

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => router.push('/(auth)/SignOutKids')}
                hitSlop={{ top: 40, bottom: 40, left: 40, right: 40 }}
                style={styles.headerButton}
            >
                <FontAwesomeIcon icon={faGear} size={24} color="black" />
            </Pressable>

            {/* Kid List Section */}
            <FlatList
                data={kids}
                keyExtractor={(item) => item.kidId || item.docId}
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
    headerButton: {
        padding: 10,
        paddingTop: 40,
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
