import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState([]);
 

  useEffect(() => {

    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

// sign in function
const signIn = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google"
  })
}

// sign out function

const signOut = async () => {
  const { error } = supabase.auth.signOut();
}

if(!session){
  <div className="m-10 py-10">
    <button>sign up here</button>
  </div>
}
else{
  return (
    <div className="w-full flex h-screen justify-center items-center p-4">
      <div className="border-[1px] border-gray-500 max-w-6xl w-full min-h-[600px] rounded-lg">
        {/* header */}
        <div className="flex justify-between h-20 border-b-[1px] border-gray-500">
          <div className="p-4">
            <p className="text-gray-300">signed in as name... </p>
            <p className="text-gray-300 italic text-sm">3 users online</p>
          </div>
          <button onClick={signOut} className="bg-gray-800 text-white font-semibold py-2 px-4 rounded m-2 sm:mr-4 ">
            Sign Out
          </button>
        </div>
        {/* main chat */}
        <div></div>
        {/* message input */}
        <form className="flex  flex-col sm:flex-row p-4 border-t-[1px] border-gray-700">
          <input
            type="text"
            placeholder="Type a message..."
            className="p-2 w-full bg-[#00000040] rounded-lg"
          />
          <button className="mt-4 sm:mt-0 sm:ml-8  bg-gray-500 max-h-12 text-white font-semibold py-2 px-3 rounded">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}


 
}

export default App;
