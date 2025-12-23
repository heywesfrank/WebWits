"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Login from "@/components/Login";
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

  // Condition 1: No User -> Show Login
  if (!session) {
    return <Login />;
  }

  // Condition 2: User Exists -> Show Main App
  return <MainApp session={session} />;
}
