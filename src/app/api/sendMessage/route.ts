import { rltdb } from "@/components/firebase";
import { push, ref, set } from "firebase/database";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { username, newMessage, messagesRef } = await req.json();
  const MesRef = ref(rltdb, messagesRef);
  try {
    const newMessageRef = push(MesRef);
    set(newMessageRef, {
      user: username,
      text: newMessage,
      timestamp: Date.now(),
    });
    console.log("Message sent");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    NextResponse.error();
  }
  return NextResponse.redirect("/");
}
