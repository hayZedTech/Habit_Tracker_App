import { createContext, useContext, useEffect, useState } from "react"
import { ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";


type AuthType = {
    user:Models.User<Models.Preferences> | null;
    isLoading:boolean;
    signUp:(email:string, password:string)=>Promise<string | null>;
    signIn:(email:string, password:string)=>Promise<string | null>;
    logout:()=>Promise<void>
}

export const AuthContext = createContext<AuthType | undefined>(undefined);

export default function AuthProvider({children}:{children:React.ReactNode}){
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(()=>{
        getUser()
    }, [])

    const getUser = async()=>{
        try{
            const session = await account.get();
            setUser(session);
        }catch(error){
            setUser(null)
        }finally{
            setIsLoading(false)
        }
    }

    const logout = async()=>{
        try{
            await account.deleteSession({sessionId:"current"})
            setUser(null)
        }catch(error){
            throw error;
        }
    }

    const signUp = async(email:string, password:string)=>{
        try{

            await account.create({userId:ID.unique(), email, password})
            signIn(email, password);
            return null;

        }catch(error){
            if(error instanceof Error){
                return error.message;
            }
            return "Error during Sign up!";
        }
    }

     const signIn = async(email:string, password:string)=>{
        try{

            await account.createEmailPasswordSession({email, password})
            const session = await account.get();
            setUser(session);
            return null;

        }catch(error){
            if(error instanceof Error){
                return error.message;
            }
            return "Error during Sign in!";
        }
    }

    return(
        <AuthContext.Provider value={{user, isLoading, signUp, signIn, logout}}>
            {children}
        </AuthContext.Provider>
    )

}

export const useAuth = () =>{
    const context = useContext(AuthContext);
    if(context === undefined){
        throw new Error("Error using context");
    }
    return context;
}