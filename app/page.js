"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import MainApp from "@/components/MainApp";

export default function Home() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Delegate all UI and Logic to MainApp
  return <MainApp session={session} />;
}
