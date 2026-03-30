import React from 'react';
import {
  BarChart3,
  Users,
  Calendar,
  Map,
  AlertCircle,
  Bell,
  Globe,
  Settings,
  LogOut,
  Plus,
  Search,
  ChevronRight,
  Home,
  Pill,
  Clock,
  Lock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  Phone,
  MapPin,
  Link as LinkIcon,
  Filter,
  Download,
  Upload,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Menu,
  X,
  Loader,
  Check,
  Activity,
  Stethoscope,
  ShoppingCart,
  Briefcase,
  Minus,
  Mail,
  ChevronLeft,
  Expand,
  Pipette,
} from 'lucide-react';

const iconMap = {
  // Navigation
  dashboard: BarChart3,
  pharmacies: Pill,
  calendar: Calendar,
  map: Map,
  emergency: AlertCircle,
  notifications: Bell,
  languages: Globe,
  settings: Settings,
  logout: LogOut,
  
  // Actions
  add: Plus,
  search: Search,
  next: ChevronRight,
  navigate_next: ChevronRight,
  navigate_before: ChevronLeft,
  home: Home,
  expand: Expand,
  
  // Status
  open: Clock,
  closed: Lock,
  emergency_status: AlertCircle,
  verified: CheckCircle,
  pending: AlertTriangle,
  incomplete: FileText,
  error: XCircle,
  
  // Trends
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
  
  // Pharmacy related
  building: Building2,
  phone: Phone,
  location: MapPin,
  link: LinkIcon,
  
  // Table actions
  filter: Filter,
  download: Download,
  upload: Upload,
  edit: Edit3,
  delete: Trash2,
  view: Eye,
  hide: EyeOff,
  
  // UI
  menu: Menu,
  close: X,
  loading: Loader,
  tick: Check,
  
  // Medical
  activity: Activity,
  stethoscope: Stethoscope,
  health: Pipette,
  cart: ShoppingCart,
  briefcase: Briefcase,
  mail: Mail,
};

export const Icon = ({ name, size = 20, className = '', color = 'currentColor', ...props }) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found. Available icons:`, Object.keys(iconMap));
    return null;
  }
  
  return (
    <IconComponent 
      size={size} 
      color={color} 
      className={className} 
      strokeWidth={2}
      {...props} 
    />
  );
};

// Convenience hook to get icon component directly
export const useIcon = (name) => {
  return iconMap[name] || null;
};

// Export all lucide icons for advanced usage
export {
  BarChart3,
  Users,
  Calendar,
  Map,
  AlertCircle,
  Bell,
  Globe,
  Settings,
  LogOut,
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  Home,
  Pill,
  Clock,
  Lock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  Phone,
  MapPin,
  Filter,
  Download,
  Upload,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Menu,
  X,
  Loader,
  Check,
  Activity,
  Stethoscope,
  Pipette,
  ShoppingCart,
  Briefcase,
  Mail,
  Minus,
  Expand,
};
