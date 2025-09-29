// app/api/login/route.js
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SignJWT } from "jose";
import cookie from "cookie";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
//const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  const { username, password } = await req.json();
  // console.log("username", username)
  // console.log("password", password)
  const client = await clientPromise;
  const db = client.db("youtube");
  const user = await db.collection("users").findOne({ username });
 // const users = await db.collection("users").find().toArray();
//console.log(users);
  //console.log("user = ", user)
  if (!user) {
    return new Response(JSON.stringify({ message: "Invalid credentials" }), { status: 401 });
  }

  //const isMatch = await bcrypt.compare(password, user.password);
  if (!password===user.password) {
    return new Response(JSON.stringify({ message: "Invalid credentials" }), { status: 401 });
  }

  // create JWT
  // const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
  //   expiresIn: "1h",
  // });

   const token = await new SignJWT({ username })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(JWT_SECRET);

  return new Response(JSON.stringify({ message: "Login successful" }), {
    status: 200,
    headers: {
      "Set-Cookie": cookie.serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60,
        path: "/",
      }),
    },
  });
}
