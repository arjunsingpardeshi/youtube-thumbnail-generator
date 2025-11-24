import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <SignIn appearance={{
        elements: {
          formButtonPrimary: "bg-black text-white hover:bg-gray-800",
        }
      }} />
    </div>
  );
}