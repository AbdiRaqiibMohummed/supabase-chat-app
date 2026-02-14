import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

export const useSession = () => {
  // eslint-disable-next-line no-undef
  const [session, setSession] = useState([]);
  
 
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  console.log(session);

  return {
    session,
    
  };
};
