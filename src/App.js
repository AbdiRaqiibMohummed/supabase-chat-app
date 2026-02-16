import { useState, useEffect,useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import { useSession } from "./hooks/useSession";



function App() {

  const { session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersOnline, setUsersOnline] = useState([]);

  const channelRef = useRef(null);
  const chatContainerRef = useRef(null)
  const scroll = useRef()


  useEffect(() => {
    if (!session?.user) {
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

    channelRef.current = roomOne;

    //broadcast
    roomOne.on("broadcast", { event: "message" }, (payload) => {
      setMessages((prevMessages) => [...prevMessages, payload.payload]);
    });
    
    // presence of all users
    roomOne.on("presence", {event: "sync" }, () => {
      const state = roomOne.presenceState();
      setUsersOnline(Object.keys(state))
    })


    //track user presence
    roomOne.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await roomOne.track({
          id: session?.user?.id,
        });
      }
    });

    return () => {
      roomOne.unsubscribe();
    };
    
  }, [session?.user?.id]);

  //useSession hook where i use useEffect

  // // sign in function
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  // // sign out function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  // channel for supabase to listen to
  // send Message

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!channelRef.current) return;

    const messagePayload = {
      message: newMessage,
      user_name: session?.user?.user_metadata?.email,
      avatar: session?.user?.user_metadata?.avatar_url,
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, messagePayload]);

    await channelRef.current.send({
      type: "broadcast",
      event: "message",
      payload: {
        message: newMessage,
        user_name: session?.user?.user_metadata?.email,
        avatar: session?.user?.user_metadata?.avatar_url,
        timestamp: new Date().toISOString(),
      },
    });

    setNewMessage("");
    console.log("User metadata:", session?.user?.user_metadata);
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleDateString("en-uk", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  useEffect(() => {
    setTimeout(() => {
      if(chatContainerRef.current){
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }
    },[100])
  },[messages])

  if (!session?.user) {
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
              <p className="text-gray-300 text-sm pt-2">{usersOnline.length} users online</p>
            </div>
            <button
              onClick={signOut}
              className="bg-gray-800 text-white font-semibold py-2 px-4 rounded m-2 sm:mr-4 "
            >
              Sign Out
            </button>
          </div>
          {/* main chat */}
          <div ref={chatContainerRef} className="p-4 flex flex-col overflow-y-auto h-[500px]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`my-2 w-full flex items-start ${
                  msg.user_name === session?.user?.user_metadata?.email
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {/* received message - avatar on left (for OTHER users) */}
                {msg.user_name !== session?.user?.user_metadata?.email && (
                  <img
                    src={msg.avatar}
                    alt="/"
                    className="w-10 h-10 rounded-full mr-2"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex flex-col w-full">
                  <div
                    className={`p-1 max-w[70%] rounded-xl ${
                      msg?.user_name === session?.user?.user_metadata?.email
                        ? "bg-gray-700 text-white ml-auto"
                        : "bg-gray-500 text-white mr-auto"
                    }`}
                  >
                    <p>{msg.message}</p>
                  </div>
                  {/* timestamp needed herer */}
                  <div
                    className={`
                    text-xs opacity-75 pt-1 ${
                      msg?.user_name === session?.user?.email
                        ? "text-right mr-2"
                        : "text-left ml-2"
                    }
                    `}
                  >
                    {formatTime(msg.timestamp)}
                  </div>
                </div>

                {msg?.user_name === session?.user?.user_metadata?.email && (
                <img
                src={msg.avatar}
                alt="avatar"
                className="w-10 h-10 rounded-full ml-2"
                referrerPolicy="no-referrer"
              />
              )}
              </div>
            ))}
          </div>
          {/* message input */}
          <form
            onSubmit={sendMessage}
            className="flex  flex-col sm:flex-row p-4 border-t-[1px] border-gray-500"
          >
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              type="text"
              placeholder="Type a message..."
              className="p-2 w-full bg-[#00000040] rounded-lg"
            />
            <button
              onClick={sendMessage}
              type="submit"
              className="mt-4 sm:mt-0 sm:ml-8  bg-gray-500 max-h-12 text-white font-semibold py-2 px-3 rounded"
            >
              Send
            </button>
            <span ref={scroll}>

            </span>
          </form>
        </div>
      </div>
    );
  }
}

export default App;
