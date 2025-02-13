import { doc, updateDoc, query, collection, where, getDoc,getDocs } from "firebase/firestore";
import { FIREBASE_DB as FIRESTORE_DB }  from '../FirebaseConfig';
import { getAuth } from "firebase/auth";

// Fetches the user type from Firestore based on the provided auth UID.
export async function getUserType(userUID: string): Promise<string | null> {
    try {
        const parentsCollectionRef = collection(FIRESTORE_DB, 'Parents');
        const q = query(parentsCollectionRef, where("userUID", "==", userUID));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`No document found for authUid: ${userUID}`);
            return null;
        }

        const userDoc = querySnapshot.docs[0]; // Get the first matching document
        const userType = userDoc.data()?.userType;
        return userType ?? null;
    } catch (error) {
        console.error("Error fetching user type:", error);
        return null;
    }
}

// Updates the authenticated user's type to "kid".
export const updateUserTypeToKid = async () => {
    try {
        const user = getAuth().currentUser;
        if (!user) {
            alert("No authenticated user found.");
            return "parent";
        }
        console.log("USER:", user);

        // Query Firestore to find the user's document
        const q = query(collection(FIRESTORE_DB, "Parents"), where("userUID", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]; // Assuming only one user document per UID
            await updateDoc(doc(FIRESTORE_DB, "Parents", userDoc.id), {
                userType: "kid",
            });

            console.log("User type updated to kid");
            return "kid"; 
        } else {
            alert("User document not found.");
        }
    } catch (error) {
        console.error("Error updating userType: ", error);
        alert("Failed to update user type.");
    }
};


// Updates the authenticated user's type to "parent".
export const updateUserTypeToParent = async () => {
    try {
        const user = getAuth().currentUser;
        if (!user) {
            alert("No authenticated user found.");
            return "parent";
        }

        // Query Firestore to find the user's document
        const q = query(collection(FIRESTORE_DB, "Parents"), where("userUID", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]; // Assuming only one user document per UID
            await updateDoc(doc(FIRESTORE_DB, "Parents", userDoc.id), {
                userType: "parent",
            });

            console.log("User type updated to parent");
            return "parent";
        } else {
            alert("User document not found.");
        }
    } catch (error) {
        console.error("Error updating userType: ", error);
        alert("Failed to update user type.");
    }
};
