import {Account, Client, Databases} from "react-native-appwrite";

export const client = new Client()
.setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
.setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!)

export const account = new Account(client);


export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!
export const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!
export const LOG_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_LOG_COLLECTION_ID!

export const databases = new Databases(client);


export interface FetchStream{
    events:string[],
    payload:any
};