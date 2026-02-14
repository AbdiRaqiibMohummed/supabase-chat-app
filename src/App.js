import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { useSession } from "./hooks/useSession";

function App() {
  const { session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersOnline, setUsersOnline] = useState([]);

  //useSession hook where i use useEffect

  // // sign in function
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  // channel for supabase to listen to
  useEffect(() => {
    if (!session.user) {
      setUsersOnline([]);
      return;
    }

    const roomOne = supabase.channel("room_one", {
      config: {
        presence: {
          key: session?.user?.id,
        },
      },
    });

    //broadcast
    roomOne.on("broadcast", { event: "message" }, (payload) => {
      setMessages((prevMessages) => [...prevMessages, payload.payload]);
      console.log(messages);
    });

    //track user presence
    roomOne.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await roomOne.track({
          id: session?.user.id,
        });
      }
    });

    // handle user presence
    roomOne.on("presence", { event: "sync" }, () => {
      const state = roomOne.presenceState();
      setUsersOnline(Object.keys(state));
    });

    // unsubscribe from room
    return () => {
      roomOne.unsubscribe();
    };

  }, [session]);


  // send Message

  const sendMessage = async (e) => {
    e.preventDefault()
  }

  // // sign out function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <div className="w-full flex h-screen justify-center items-center">
        <button className="p-3 bg-gray-800 rounded-lg" onClick={signIn}>
          Sign in with Google to chat
        </button>
      </div>
    );
  } else {
    return (
      <div className="w-full flex h-screen justify-center items-center p-4">
        <div className="border-[1px] border-gray-500 max-w-6xl w-full min-h-[600px] rounded-lg">
          {/* header */}
          <div className="flex justify-between h-20 border-b-[1px] border-gray-500">
            <div className="p-4">
              <p className="text-gray-300">
                Signed in as {session?.user?.user_metadata?.full_name}{" "}
              </p>
              <p className="text-gray-300 italic text-sm">3 users online</p>
            </div>
            <button
              onClick={signOut}
              className="bg-gray-800 text-white font-semibold py-2 px-4 rounded m-2 sm:mr-4 "
            >
              Sign Out
            </button>
          </div>
          {/* main chat */}
          <div className="p-4 flex flex-col overflow-y-auto h-[500px]"></div>
          {/* message input */}
          <form className="flex  flex-col sm:flex-row p-4 border-t-[1px] border-gray-500">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
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
