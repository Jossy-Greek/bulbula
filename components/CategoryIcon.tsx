import {
  BedDouble,
  Church,
  Coffee,
  Croissant,
  Dumbbell,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Landmark,
  Pill,
  Scissors,
  Shield,
  ShoppingCart,
  Stethoscope,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  coffee: Coffee,
  croissant: Croissant,
  "shopping-cart": ShoppingCart,
  pill: Pill,
  "heart-pulse": HeartPulse,
  landmark: Landmark,
  bed: BedDouble,
  home: Home,
  "graduation-cap": GraduationCap,
  wrench: Wrench,
  scissors: Scissors,
  church: Church,
  shield: Shield,
  "hand-heart": HandHeart,
  store: Store,
  stethoscope: Stethoscope,
  dumbbell: Dumbbell,
};

export default function CategoryIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Store;
  return <Icon className={className} aria-hidden="true" />;
}
