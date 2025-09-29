// app/api/logout/route.js
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const cookieStore = cookies();

    // Clear the token cookie
    cookieStore.set({
      name: 'token',
      value: '',
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // immediately expire
    });

    return new Response(
      JSON.stringify({ message: 'Logged out successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Logout failed', details: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
