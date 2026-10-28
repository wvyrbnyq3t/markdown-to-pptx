import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import type { FieldValue } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// types
export type DocumentData = {
  documentId: string;
  creatorId: string;
  content: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

// Create
export const saveDocument = async ({ content }: { content: string }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User is not authenticated");

  const documentId = uuidv4();
  const documentDocRef = doc(db, "documents", documentId);

  await setDoc(documentDocRef, {
    documentId,
    creatorId: user.uid,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as DocumentData);
};

// Road
export const loadDocumentById = async (documentId: string) => {
  const documentDocRef = doc(db, "documents", documentId);
  const ss = await getDoc(documentDocRef);

  if (!ss.exists()) throw new Error("Document not found");

  const data = ss.data() as DocumentData;
  return data;
};
