import { ModeToggle } from "@/components/mode-toggle";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-secondary">
      <div className="text-lg font-semibold">Youtube Thumbnail Creator</div>
      <ModeToggle />
    </nav>
  );
}
