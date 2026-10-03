const fs = require('fs');
const file = 'client/src/screens/More/MoreScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import {\n  User,\n  Calendar,\n  Bell,\n  Bookmark,\n  Search,\n  Settings,\n  Sun,\n  Moon,\n  ChevronRight,\n  LogOut,\n  LucideIcon,\n} from 'lucide-react-native';",
  "import {\n  User,\n  Calendar,\n  Bell,\n  Bookmark,\n  Search,\n  Settings,\n  Sun,\n  Moon,\n  ChevronRight,\n  LogOut,\n  FolderKanban,\n  LucideIcon,\n} from 'lucide-react-native';"
);

const newMenuItem = `    {
      id: 'my-projects',
      title: 'My Projects',
      subtitle: 'Projects you own or joined',
      icon: FolderKanban,
      route: 'MyProjects',
    },
    {
      id: 'profile',`;

content = content.replace("    {\n      id: 'profile',", newMenuItem);
fs.writeFileSync(file, content);
