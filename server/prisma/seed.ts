import {
  PrismaClient,
  ExperienceLevel,
  ProjectRole,
  MemberStatus,
  ProjectStatus,
  TaskStatus,
  Priority,
  MeetingStatus,
  EventType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 200 Distinct Bangladeshi Names and details
const BANGLADESHI_NAMES: {
  email: string;
  fullName: string;
  department: string;
  semester: string;
  level: ExperienceLevel;
  primarySkills: string[];
  bio: string;
}[] = [
  { email: 'tanvir@teamup.com', fullName: 'Tanvir Hasan', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Full-stack mobile enthusiast specializing in cross-platform systems and NestJS backends.' },
  { email: 'sadia@teamup.com', fullName: 'Sadia Islam', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Passionate UI/UX designer and frontend engineer crafting pixel-perfect accessible student apps.' },
  { email: 'rahim@teamup.com', fullName: 'Rahim Ahmed', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Backend engineer focused on scalable relational databases, data pipelines, and Docker containers.' },
  { email: 'karim@teamup.com', fullName: 'Karim Uddin', department: 'Electrical & Electronic Engineering', semester: 'Fall 2025', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'C++', 'IoT & Hardware'], bio: 'Robotics and embedded systems builder interfacing microcontrollers with Python servers.' },
  { email: 'anika@teamup.com', fullName: 'Anika Tabassum', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'TensorFlow'], bio: 'NLP and machine learning researcher building Bangla language models and translation tools.' },
  { email: 'tahmid@teamup.com', fullName: 'Tahmid Rahman', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'PostgreSQL'], bio: 'Mobile app developer enthusiastic about clean architecture, state management, and real-time APIs.' },
  { email: 'nusrat@teamup.com', fullName: 'Nusrat Jahan', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['TypeScript', 'React Native', 'Tailwind CSS'], bio: 'Junior developer passionate about building social impact applications for education.' },
  { email: 'mehedi@teamup.com', fullName: 'Mehedi Hasan', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['Python', 'Docker', 'Kubernetes'], bio: 'DevOps aficionado and backend developer building cloud architectures and automated pipelines.' },
  { email: 'farhan@teamup.com', fullName: 'Farhan Kabir', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'API developer who values clean code, strict domain validation, and comprehensive automated tests.' },
  { email: 'nabil@teamup.com', fullName: 'Nabil Mahmud', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'Figma', 'TypeScript'], bio: 'Creative developer building modern cross-platform mobile apps with fluid animations.' },
  { email: 'sabbir@teamup.com', fullName: 'Sabbir Hossain', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Node.js', 'Redis', 'PostgreSQL'], bio: 'High-throughput system designer working on real-time WebSockets and low-latency caches.' },
  { email: 'ariful@teamup.com', fullName: 'Ariful Islam', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'Machine Learning', 'SQL'], bio: 'Data science student analyzing campus transportation patterns and urban logistics.' },
  { email: 'tasnim@teamup.com', fullName: 'Tasnim Chowdhury', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Experienced developer building student collaboration and peer study group software.' },
  { email: 'sumaiya@teamup.com', fullName: 'Sumaiya Akter', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'Next.js'], bio: 'Product designer obsessed with minimalist user journeys, design tokens, and accessibility.' },
  { email: 'rifat@teamup.com', fullName: 'Rifat Alom', department: 'Computer Science & Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Python', 'Docker'], bio: 'Security researcher focused on penetration testing, OAuth2 security, and secure API gateways.' },
  { email: 'sakib@teamup.com', fullName: 'Sakib Al Hasan', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Firebase', 'TypeScript'], bio: 'Mobile engineer focused on offline-first sync and distributed team workflows.' },
  { email: 'tamim@teamup.com', fullName: 'Tamim Iqbal', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Python'], bio: 'Aspiring web developer excited to collaborate on university hackathon projects.' },
  { email: 'mushfiq@teamup.com', fullName: 'Mushfiqur Rahim', department: 'Computer Science & Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Enterprise backend developer who writes resilient transactional services.' },
  { email: 'mashrafe@teamup.com', fullName: 'Mashrafe Mortaza', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Agile Leadership', 'TypeScript', 'Node.js'], bio: 'Experienced tech lead passionate about mentoring junior peers and shipping on time.' },
  { email: 'shakil@teamup.com', fullName: 'Shakil Ahmed', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'PostgreSQL', 'Docker'], bio: 'Modular backend architect focused on Prisma ORM migrations and database normalization.' },
  { email: 'ashik@teamup.com', fullName: 'Ashikur Rahman', department: 'Electrical & Electronic Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['C++', 'Python', 'IoT & Hardware'], bio: 'Hardware tinkerer connecting campus environmental sensors to cloud dashboards.' },
  { email: 'fahim@teamup.com', fullName: 'Fahim Montasir', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'GraphQL', 'TypeScript'], bio: 'Frontend engineer with a passion for high-performance React Native rendering.' },
  { email: 'nayem@teamup.com', fullName: 'Nayem Hasan', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'Django', 'PostgreSQL'], bio: 'Web developer building academic resource portals and exam preparation archives.' },
  { email: 'zahid@teamup.com', fullName: 'Zahidul Islam', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Go', 'Docker', 'Kubernetes'], bio: 'Systems engineer passionate about microservices and scalable cloud backends.' },
  { email: 'habib@teamup.com', fullName: 'Ahsan Habib', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'Node.js', 'MongoDB'], bio: 'Cross-platform app developer building community marketplace tools.' },
  { email: 'ismail@teamup.com', fullName: 'Ismail Hossain', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Data Analytics'], bio: 'Data analytics enthusiast interested in university GPA and career outcome metrics.' },
  { email: 'kamrul@teamup.com', fullName: 'Kamrul Hasan', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['TypeScript', 'NestJS', 'PostgreSQL'], bio: 'Full-stack software crafter advocating for type safety from database to client.' },
  { email: 'monir@teamup.com', fullName: 'Moniruzzaman', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'Tailwind CSS'], bio: 'Designer who codes. Bridge between visual hierarchy and responsive code.' },
  { email: 'faisal@teamup.com', fullName: 'Faisal Ahmed', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Flutter', 'Dart', 'Firebase'], bio: 'Mobile app beginner building campus lost and found trackers.' },
  { email: 'shahid@teamup.com', fullName: 'Shahidul Alam', department: 'Computer Science & Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'PyTorch', 'Python'], bio: 'Computer vision researcher working on optical character recognition for Bangla documents.' },
  { email: 'jamil@teamup.com', fullName: 'Jamilur Reza', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Collaborative team player experienced in Agile sprints and git worktree flows.' },
  { email: 'imran@teamup.com', fullName: 'Imran Nazir', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Next.js', 'TypeScript', 'PostgreSQL'], bio: 'Web engineer creating performant server-side rendered portals for campus clubs.' },
  { email: 'siam@teamup.com', fullName: 'Siam Ahmed', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['React Native', 'JavaScript', 'Figma'], bio: 'Passionate student seeking to join senior peer projects to level up development skills.' },
  { email: 'shuvo@teamup.com', fullName: 'Shuvo Dev', department: 'Computer Science & Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Database performance specialist and backend programmer.' },
  { email: 'towhid@teamup.com', fullName: 'Towhid Hridoy', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'PostgreSQL'], bio: 'Mobile developer excited about building sports and fitness tracking utilities.' },
  { email: 'ashraful@teamup.com', fullName: 'Mohammad Ashraful', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['C++', 'Python', 'Data Structures'], bio: 'Competitive programmer keen on applying algorithmic skills to real-world software.' },
  { email: 'nazmul@teamup.com', fullName: 'Nazmul Hossain', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Go', 'PostgreSQL', 'Docker'], bio: 'Backend engineer focused on concurrency and distributed key-value stores.' },
  { email: 'alamin@teamup.com', fullName: 'Al-Amin Hossain', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Full-stack teammate with hands-on experience in socket-driven chat apps.' },
  { email: 'tariq@teamup.com', fullName: 'Tariqul Islam', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Focusing on intuitive mobile interaction design and motion prototyping.' },
  { email: 'saiful@teamup.com', fullName: 'Saiful Islam', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'PostgreSQL', 'Redis'], bio: 'Microservice developer with a track record of building robust rate-limited APIs.' },
  { email: 'sohel@teamup.com', fullName: 'Sohel Rana', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Enthusiastic beginner student looking for teammates for semester term projects.' },
  { email: 'rubel@teamup.com', fullName: 'Rubel Hossain', department: 'Electrical & Electronic Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['C++', 'IoT & Hardware', 'Python'], bio: 'Smart grid and campus electricity monitoring researcher.' },
  { email: 'shamim@teamup.com', fullName: 'Shamim Patwary', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'TypeScript', 'Firebase'], bio: 'Mobile frontend developer fond of reactive UI and clean separation of concerns.' },
  { email: 'anik@teamup.com', fullName: 'Anik Sarkar', department: 'Computer Science & Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['TypeScript', 'React Native', 'NestJS'], bio: 'Lead engineer experienced in end-to-end mobile architecture and database schema design.' },
  { email: 'joy@teamup.com', fullName: 'Joy Barua', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['React Native', 'JavaScript', 'HTML/CSS'], bio: 'Curious learner excited to build social impact student applications.' },
  { email: 'dipu@teamup.com', fullName: 'Dipu Moni', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'Design Systems'], bio: 'Component library author and accessibility advocate.' },
  { email: 'rajib@teamup.com', fullName: 'Rajib Sen', department: 'Computer Science & Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Senior software engineering student building fault-tolerant backend services.' },
  { email: 'palash@teamup.com', fullName: 'Palash Bhowmik', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'Machine Learning', 'PostgreSQL'], bio: 'AI enthusiast analyzing university student attendance and collaborative study trends.' },
  { email: 'mithun@teamup.com', fullName: 'Mithun Ali', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Node.js', 'Express', 'MongoDB'], bio: 'Backend explorer learning RESTful design patterns and JSON envelope standards.' },
  { email: 'biplob@teamup.com', fullName: 'Biplob Kumar', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Python', 'Linux'], bio: 'Network defense researcher examining zero-trust architectures in educational intranets.' },
  { email: 'asif@teamup.com', fullName: 'Asif Mahmud', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Developer passionate about student advocacy, hackathons, and real-time utilities.' },
  { email: 'mahfuz@teamup.com', fullName: 'Mahfuzur Rahman', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'Architect designing clean domain-driven NestJS modules and automated test suites.' },
  { email: 'shafi@teamup.com', fullName: 'Shafiul Islam', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'HTML/CSS'], bio: 'Aspiring engineer eager to collaborate on data-intensive term projects.' },
  { email: 'redwan@teamup.com', fullName: 'Redwan Ahmed', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Dart', 'Firebase'], bio: 'Cross-platform mobile builder with a focus on polished UI transitions.' },
  { email: 'sadman@teamup.com', fullName: 'Sadman Sakib', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'Figma'], bio: 'Full-stack builder delivering smooth mobile applications from concept to Play Store.' },
  { email: 'salman@teamup.com', fullName: 'Salman Farsi', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Go', 'PostgreSQL', 'Docker'], bio: 'Concurrency enthusiast building microservices for high-frequency notifications.' },
  { email: 'shadman@teamup.com', fullName: 'Shadman Islam', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'React Native', 'Git'], bio: 'Eager to contribute clean code to active mobile teams.' },
  { email: 'rayhan@teamup.com', fullName: 'Rayhan Kabir', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'PostgreSQL'], bio: 'Predictive modeling specialist applying ranking algorithms to student matching.' },
  { email: 'sifat@teamup.com', fullName: 'Sifat Ullah', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'TypeScript', 'Docker'], bio: 'Backend developer focused on resilient token authentication and RBAC guards.' },
  { email: 'shahriar@teamup.com', fullName: 'Shahriar Nafees', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'Node.js', 'PostgreSQL'], bio: 'Mobile product builder with experience leading multi-disciplinary engineering teams.' },
  { email: 'shahan@teamup.com', fullName: 'Shahan Chowdhury', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'HTML/CSS', 'SQL'], bio: 'Exploring database indexing and query optimization on open-source datasets.' },
  { email: 'mahdi@teamup.com', fullName: 'Mahdi Al-Amin', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Focused on accessibility standards, color contrast, and inclusive touch targets.' },
  { email: 'wasif@teamup.com', fullName: 'Wasif Zaman', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Python', 'Docker', 'Kubernetes'], bio: 'Cloud infrastructure engineer automating container deployment and canary releases.' },
  { email: 'muhtasim@teamup.com', fullName: 'Muhtasim Billah', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Student developer building real-time collaboration canvas and sticky note boards.' },
  { email: 'muntasir@teamup.com', fullName: 'Muntasir Mamun', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['C++', 'Python', 'Git'], bio: 'Algorithmic programmer seeking hands-on mobile and web engineering experience.' },
  { email: 'rezwan@teamup.com', fullName: 'Rezwanul Haque', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'PostgreSQL', 'Redis'], bio: 'Backend engineer focused on database replication and WebSocket clustering.' },
  { email: 'shahadat@teamup.com', fullName: 'Shahadat Hossain', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'PostgreSQL'], bio: 'Cross-platform app designer creating scheduling tools for university societies.' },
  { email: 'shahin@teamup.com', fullName: 'Shahin Alam', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Figma'], bio: 'Junior developer building clean responsive web interfaces.' },
  { email: 'jahid@teamup.com', fullName: 'Jahid Hasan', department: 'Computer Science & Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['TypeScript', 'React Native', 'PostgreSQL'], bio: 'Senior developer passionate about state machine architectures and offline storage.' },
  { email: 'rakib@teamup.com', fullName: 'Rakibul Hasan', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'Machine Learning', 'Docker'], bio: 'Data engineer processing real-time sensor streams and telemetry.' },
  { email: 'sourav@teamup.com', fullName: 'Sourav Ganguly', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'TypeScript'], bio: 'Visual designer dedicated to creating fluid mobile user journeys.' },
  { email: 'amit@teamup.com', fullName: 'Amit Kumar', department: 'Computer Science & Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'Docker'], bio: 'Enterprise backend developer experienced with distributed caching and Kafka.' },
  { email: 'anupam@teamup.com', fullName: 'Anupam Roy', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['React Native', 'JavaScript', 'SQL'], bio: 'Student programmer developing peer-to-peer textbook exchange apps.' },
  { email: 'prosenjit@teamup.com', fullName: 'Prosenjit Das', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'API developer who loves clean schema design and Prisma migrations.' },
  { email: 'subrata@teamup.com', fullName: 'Subrata Paul', department: 'Computer Science & Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Go', 'Docker', 'Kubernetes'], bio: 'DevOps lead focused on CI/CD pipelines, automated testing, and release tagging.' },
  { email: 'debabrata@teamup.com', fullName: 'Debabrata Ghosh', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'HTML/CSS', 'Git'], bio: 'Junior developer looking to join a high-impact university capstone project.' },
  { email: 'ripon@teamup.com', fullName: 'Ripon Mia', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Dart', 'Firebase'], bio: 'Mobile programmer building campus event notification hubs.' },
  { email: 'sujon@teamup.com', fullName: 'Sujon Ahmed', department: 'Computer Science & Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Full-stack builder committed to clean documentation and test coverage.' },
  { email: 'liton@teamup.com', fullName: 'Liton Das', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Backend data enthusiast working on campus bus tracking APIs.' },
  { email: 'sumon@teamup.com', fullName: 'Sumon Sikder', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['UI/UX', 'Figma', 'HTML/CSS'], bio: 'Aspiring product designer focused on student-centered design patterns.' },
  { email: 'parvez@teamup.com', fullName: 'Parvez Hossain', department: 'Computer Science & Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'TypeScript', 'PostgreSQL'], bio: 'Backend engineer focused on database indexes, transactions, and concurrency.' },
  { email: 'masud@teamup.com', fullName: 'Masud Rana', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Figma'], bio: 'Mobile front-end engineer building polished navigation and modal systems.' },
  { email: 'selim@teamup.com', fullName: 'Selim Reza', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'C++', 'Git'], bio: 'Enthusiastic beginner student keen to learn React Native with a supportive team.' },
  { email: 'belal@teamup.com', fullName: 'Belal Ahmed', department: 'Computer Science & Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Go', 'Linux'], bio: 'Security researcher auditing REST API endpoints and preventing token leakage.' },
  { email: 'anwar@teamup.com', fullName: 'Anwar Hossain', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'PostgreSQL'], bio: 'Cross-platform developer working on campus food delivery solutions.' },
  { email: 'delwar@teamup.com', fullName: 'Delwar Jahid', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'SQL'], bio: 'Eager student looking to contribute front-end UI and test suites.' },
  { email: 'enamul@teamup.com', fullName: 'Enamul Haque', department: 'Computer Science & Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'PyTorch'], bio: 'AI researcher training deep learning models for local healthcare diagnostics.' },
  { email: 'mizan@teamup.com', fullName: 'Mizanur Rahman', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Full-stack student engineer experienced in agile teamwork.' },
  { email: 'zakir@teamup.com', fullName: 'Zakir Hasan', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Data structures student passionate about algorithmic problem solving.' },
  { email: 'siraj@teamup.com', fullName: 'Sirajul Islam', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Backend developer with strong foundations in distributed system design.' },
  { email: 'morshed@teamup.com', fullName: 'Morshedul Islam', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Product designer focusing on accessible dark mode palettes and typography.' },
  { email: 'babul@teamup.com', fullName: 'Babul Akhter', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Python'], bio: 'Aspiring web developer exploring full-stack JavaScript architectures.' },
  { email: 'harun@teamup.com', fullName: 'Harun Ur Rashid', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Docker', 'Kubernetes', 'Go'], bio: 'Infrastructure engineer automating CI workflows and container builds.' },
  { email: 'azad@teamup.com', fullName: 'Abul Kalam Azad', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Backend data pipeline engineer building analytical dashboards.' },
  { email: 'mozammel@teamup.com', fullName: 'Mozammel Haque', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['C++', 'Python', 'SQL'], bio: 'Eager student looking to learn Git workflow and pull request practices.' },
  { email: 'lutfor@teamup.com', fullName: 'Lutfor Rahman', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Architect specialized in building scalable, real-time university portals.' },
  { email: 'khorshed@teamup.com', fullName: 'Khorshed Alam', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Dart', 'Firebase'], bio: 'Mobile developer building study scheduler apps with calendar integrations.' },
  { email: 'mustafiz@teamup.com', fullName: 'Mustafizur Rahman', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['Go', 'PostgreSQL', 'Docker'], bio: 'Backend developer focused on high-performance concurrency and network I/O.' },
  { email: 'taskin@teamup.com', fullName: 'Taskin Ahmed', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Figma'], bio: 'Fast-paced mobile developer who values clean UI components.' },
  { email: 'shoriful@teamup.com', fullName: 'Shoriful Islam', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'HTML/CSS', 'Git'], bio: 'Junior developer looking for active team projects to contribute to.' },
  { email: 'tanzim@teamup.com', fullName: 'Tanzim Hasan', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'API developer who writes automated unit and integration tests.' },
  { email: 'rishad@teamup.com', fullName: 'Rishad Hossain', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'TensorFlow'], bio: 'Data scientist applying recommendation algorithms to student matching.' },
  { email: 'mahin@teamup.com', fullName: 'Mahin Khan', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'NestJS', 'PostgreSQL'], bio: 'TeamUp platform creator and project lead.' },
  { email: 'jannat@teamup.com', fullName: 'Jannatul Ferdous', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Lead designer focused on seamless onboarding and student engagement.' },
  { email: 'samira@teamup.com', fullName: 'Samira Khan', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'Django', 'PostgreSQL'], bio: 'Backend developer passionate about educational resource sharing platforms.' },
  { email: 'farzana@teamup.com', fullName: 'Farzana Haque', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'PyTorch'], bio: 'AI researcher focused on Bangla speech processing and audio recognition.' },
  { email: 'sharmin@teamup.com', fullName: 'Sharmin Sultana', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['TypeScript', 'React Native', 'HTML/CSS'], bio: 'Junior mobile developer passionate about creating accessible user interfaces.' },
  { email: 'ruma@teamup.com', fullName: 'Ruma Akter', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'PostgreSQL', 'Docker'], bio: 'Backend engineer who prioritizes clean database relations and error filters.' },
  { email: 'sonia@teamup.com', fullName: 'Sonia Akhter', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Python', 'Linux'], bio: 'Security engineer exploring vulnerability assessment tools for educational networks.' },
  { email: 'lima@teamup.com', fullName: 'Lima Begum', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Eager student looking to learn mobile app architecture alongside mentors.' },
  { email: 'rina@teamup.com', fullName: 'Rina Parveen', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'Firebase'], bio: 'Mobile developer building social and health telemetry tracking apps.' },
  { email: 'shirin@teamup.com', fullName: 'Shirin Sharmin', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'Design Systems'], bio: 'Design systems engineer crafting consistent design tokens and layout rules.' },
  { email: 'nahid@teamup.com', fullName: 'Nahid Sultana', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Mobile developer experienced in state management and offline synchronization.' },
  { email: 'afroza@teamup.com', fullName: 'Afroza Abbas', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Data Analytics'], bio: 'Aspiring data analyst investigating student retention and collaboration patterns.' },
  { email: 'rumana@teamup.com', fullName: 'Rumana Ahmed', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Go', 'PostgreSQL', 'Docker'], bio: 'High-performance API architect building real-time microservices.' },
  { email: 'sabina@teamup.com', fullName: 'Sabina Khatun', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'TypeScript', 'Docker'], bio: 'Backend engineer focused on test-driven development and clean code.' },
  { email: 'nasrin@teamup.com', fullName: 'Nasrin Jahan', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['C++', 'Python', 'Algorithms'], bio: 'Problem solver eager to apply algorithmic techniques to mobile projects.' },
  { email: 'salma@teamup.com', fullName: 'Salma Khatun', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'TensorFlow'], bio: 'Deep learning practitioner working on healthcare diagnosis models.' },
  { email: 'bilkis@teamup.com', fullName: 'Bilkis Banu', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'Figma', 'TypeScript'], bio: 'Frontend engineer with an eye for typography, layout, and contrast.' },
  { email: 'parveen@teamup.com', fullName: 'Parveen Sultana', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Junior developer looking for collaborative term projects to join.' },
  { email: 'shaila@teamup.com', fullName: 'Shaila Sharmin', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Enterprise backend engineer specialized in transactional workflows.' },
  { email: 'sabrina@teamup.com', fullName: 'Sabrina Mumtaz', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Dart', 'Firebase'], bio: 'Mobile application developer passionate about campus community projects.' },
  { email: 'mim@teamup.com', fullName: 'Bidya Sinha Mim', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['UI/UX', 'Figma', 'HTML/CSS'], bio: 'Creative designer interested in interactive prototypes and user surveys.' },
  { email: 'tisha@teamup.com', fullName: 'Nusrat Imrose Tisha', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Full-stack mobile engineer building team matching software.' },
  { email: 'purnima@teamup.com', fullName: 'Dilara Hanif Purnima', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Backend data engineer focused on relational schema design and migrations.' },
  { email: 'puja@teamup.com', fullName: 'Puja Cherry', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Student programmer seeking a supportive group for term coursework.' },
  { email: 'shreya@teamup.com', fullName: 'Shreya Ghoshal', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Design lead with strong background in audio and multimedia interfaces.' },
  { email: 'mou@teamup.com', fullName: 'Sadia Islam Mou', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'TypeScript', 'PostgreSQL'], bio: 'Backend engineer passionate about clean REST endpoints and error filters.' },
  { email: 'bristi@teamup.com', fullName: 'Bristi Das', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'React Native', 'HTML/CSS'], bio: 'Junior developer enthusiastic about responsive mobile design.' },
  { email: 'chaity@teamup.com', fullName: 'Chaity Roy', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'PyTorch'], bio: 'AI researcher working on agricultural disease detection models.' },
  { email: 'nodi@teamup.com', fullName: 'Nodi Chowdhury', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'PostgreSQL'], bio: 'Cross-platform app engineer with a focus on real-time chat sync.' },
  { email: 'megha@teamup.com', fullName: 'Megha Dutta', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Data Analytics'], bio: 'Aspiring data scientist exploring predictive recommendation engines.' },
  { email: 'shanta@teamup.com', fullName: 'Shanta Islam', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Linux', 'Python'], bio: 'Security specialist auditing authentication and JWT rotation flows.' },
  { email: 'laboni@teamup.com', fullName: 'Laboni Akter', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Figma'], bio: 'Mobile developer building modular components and reusable hooks.' },
  { email: 'akhi@teamup.com', fullName: 'Akhi Alamgir', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Beginner programmer seeking teammates for semester app challenges.' },
  { email: 'shampa@teamup.com', fullName: 'Shampa Reza', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Backend engineer focused on robust concurrency and database locking.' },
  { email: 'rupa@teamup.com', fullName: 'Rupa Dutta', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Visual designer dedicated to creating intuitive user onboarding.' },
  { email: 'keya@teamup.com', fullName: 'Keya Payel', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['C++', 'Python', 'Algorithms'], bio: 'Algorithmic problem solver excited about data structures.' },
  { email: 'popy@teamup.com', fullName: 'Sadika Parvin Popy', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Lead mobile developer experienced in end-to-end release automation.' },
  { email: 'swapna@teamup.com', fullName: 'Swapna Rani', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Backend developer focused on relational database indexing.' },
  { email: 'munira@teamup.com', fullName: 'Munira Yusuf', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'SQL'], bio: 'Junior developer interested in web portals for university events.' },
  { email: 'farida@teamup.com', fullName: 'Farida Parveen', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'TensorFlow'], bio: 'AI researcher analyzing student sentiment in peer reviews.' },
  { email: 'shahana@teamup.com', fullName: 'Shahana Goswami', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'Firebase'], bio: 'Mobile developer building real-time collaboration apps.' },
  { email: 'rehana@teamup.com', fullName: 'Rehana Maryam', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Data analysis enthusiast exploring student project statistics.' },
  { email: 'khadija@teamup.com', fullName: 'Khadija Tul Kobra', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'PostgreSQL', 'Docker'], bio: 'Backend engineer focused on database transaction isolation.' },
  { email: 'fatema@teamup.com', fullName: 'Fatema Tuz Zohra', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Figma'], bio: 'Mobile developer passionate about accessible navigation flows.' },
  { email: 'ayesha@teamup.com', fullName: 'Ayesha Siddiqua', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Beginner student keen on learning full-stack development.' },
  { email: 'marium@teamup.com', fullName: 'Marium Begum', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Linux', 'Python'], bio: 'Information security researcher analyzing campus Wi-Fi policies.' },
  { email: 'rokeya@teamup.com', fullName: 'Begum Rokeya', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['Agile Leadership', 'TypeScript', 'React Native'], bio: 'Project mentor and educator passionate about women in STEM.' },
  { email: 'suraiya@teamup.com', fullName: 'Suraiya Begum', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'Tailwind CSS'], bio: 'Designer focusing on student productivity tools and task boards.' },
  { email: 'shamima@teamup.com', fullName: 'Shamima Begum', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Junior developer enthusiastic about learning PostgreSQL.' },
  { email: 'dilruba@teamup.com', fullName: 'Dilruba Khan', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Backend engineer experienced with large-scale relational schemas.' },
  { email: 'morsheda@teamup.com', fullName: 'Morsheda Khatun', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'TypeScript'], bio: 'Cross-platform mobile developer creating attendance tracking tools.' },
  { email: 'kamrun@teamup.com', fullName: 'Kamrun Nahar', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Figma'], bio: 'UI designer building student project showcase pages.' },
  { email: 'jahanara@teamup.com', fullName: 'Jahanara Alam', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Full-stack engineer passionate about sports and health tech apps.' },
  { email: 'tahmina@teamup.com', fullName: 'Tahmina Anam', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'Machine Learning', 'Docker'], bio: 'Author and computational linguist exploring Bangla text generation.' },
  { email: 'hosne@teamup.com', fullName: 'Hosne Ara', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Student developer learning relational queries and REST APIs.' },
  { email: 'ferdousi@teamup.com', fullName: 'Ferdousi Mazumdar', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'Senior engineer advocating for strict DTO validation pipes.' },
  { email: 'shanjida@teamup.com', fullName: 'Shanjida Akter', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Designer building engaging student project cards and metrics.' },
  { email: 'israt@teamup.com', fullName: 'Israt Jahan', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Junior developer looking to collaborate on university club apps.' },
  { email: 'marufa@teamup.com', fullName: 'Marufa Akter', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Go', 'PostgreSQL', 'Docker'], bio: 'Backend engineer passionate about high-throughput messaging.' },
  { email: 'farhana@teamup.com', fullName: 'Farhana Mili', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Mobile front-end engineer building clean task Kanban boards.' },
  { email: 'tanjila@teamup.com', fullName: 'Tanjila Islam', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Student developer keen on database schemas and relational models.' },
  { email: 'mahbuba@teamup.com', fullName: 'Mahbuba Islam', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Python', 'Linux'], bio: 'Security engineer auditing access controls and refresh token rotation.' },
  { email: 'jannatul@teamup.com', fullName: 'Jannatul Nayeem', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Dart', 'Firebase'], bio: 'Mobile developer building social impact student apps.' },
  { email: 'lamia@teamup.com', fullName: 'Lamia Mizan', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['UI/UX', 'Figma', 'HTML/CSS'], bio: 'Creative designer interested in user research and prototyping.' },
  { email: 'raisa@teamup.com', fullName: 'Raisa Tabassum', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Full-stack developer building real-time student team matching.' },
  { email: 'maisha@teamup.com', fullName: 'Maisha Maliha', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Backend engineer passionate about automated test suites.' },
  { email: 'bushra@teamup.com', fullName: 'Bushra Afreen', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Student developer passionate about campus environmental initiatives.' },
  { email: 'afia@teamup.com', fullName: 'Afia Humaira', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'PyTorch'], bio: 'AI specialist applying NLP to academic paper summarization.' },
  { email: 'fabiha@teamup.com', fullName: 'Fabiha Bushra', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'API developer who values clean architecture and error filtering.' },
  { email: 'zarin@teamup.com', fullName: 'Zarin Subah', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Figma'], bio: 'Junior developer excited to design responsive web dashboards.' },
  { email: 'humaira@teamup.com', fullName: 'Humaira Himu', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'Figma'], bio: 'Experienced mobile front-end developer building polished apps.' },
  { email: 'mehreen@teamup.com', fullName: 'Mehreen Mahmud', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Backend engineer focused on relational data integrity and caching.' },
  { email: 'suborna@teamup.com', fullName: 'Suborna Mustafa', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Aspiring programmer looking for collaborative projects.' },
  { email: 'shabnur@teamup.com', fullName: 'Shabnur Nupur', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Design lead with expertise in interactive design and design systems.' },
  { email: 'moushumi@teamup.com', fullName: 'Arifa Parvin Moushumi', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'Firebase'], bio: 'Cross-platform app engineer building student event schedulers.' },
  { email: 'shabana@teamup.com', fullName: 'Afroza Sultana Shabana', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Junior student learning JavaScript and front-end development.' },
  { email: 'kabori@teamup.com', fullName: 'Sarah Begum Kabori', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'Senior software engineering student leading capstone teams.' },
  { email: 'bobita@teamup.com', fullName: 'Farida Akhter Bobita', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'Machine Learning', 'Docker'], bio: 'Data analyst investigating student collaboration algorithms.' },
  { email: 'champa@teamup.com', fullName: 'Gulshan Ara Champa', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['UI/UX', 'Figma', 'HTML/CSS'], bio: 'Creative designer exploring modern UI aesthetics and layouts.' },
  { email: 'diti@teamup.com', fullName: 'Parveen Sultana Diti', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Full-stack engineer building campus student marketplace tools.' },
  { email: 'rozina@teamup.com', fullName: 'Rowshan Ara Rozina', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Go', 'PostgreSQL', 'Docker'], bio: 'Backend developer focused on concurrency and low-latency APIs.' },
  { email: 'anju@teamup.com', fullName: 'Anju Ghosh', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Student programmer seeking a supportive group for semester coursework.' },
  { email: 'nuton@teamup.com', fullName: 'Farhana Amin Nuton', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Linux', 'Python'], bio: 'Security researcher auditing campus software and OAuth integrations.' },
  { email: 'suchorita@teamup.com', fullName: 'Suchorita Roy', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'API engineer who values strong typing and relational data integrity.' },
  { email: 'suchanda@teamup.com', fullName: 'Kohinoor Akhter Suchanda', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Flutter', 'Dart', 'Firebase'], bio: 'Mobile developer eager to build campus communication apps.' },
  { email: 'anwara@teamup.com', fullName: 'Anwara Begum', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Backend software developer building robust web applications.' },
  { email: 'dolly@teamup.com', fullName: 'Dolly Zahur', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Figma'], bio: 'Mobile developer passionate about student mentoring applications.' },
  { email: 'sharmili@teamup.com', fullName: 'Sharmili Ahmed', department: 'Information & Communication Technology', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Eager junior programmer interested in front-end web development.' },
  { email: 'dilara@teamup.com', fullName: 'Dilara Zaman', department: 'Software Engineering', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Veteran UI/UX designer and educator mentoring student teams.' },
  { email: 'rawshan@teamup.com', fullName: 'Rawshan Jamil', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Backend data engineer working on campus bus tracking APIs.' },
  { email: 'maya@teamup.com', fullName: 'Maya Hazarika', department: 'Information & Communication Technology', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Data analysis enthusiast exploring student project statistics.' },
  { email: 'minu@teamup.com', fullName: 'Minu Rahman', department: 'Software Engineering', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Full-stack engineer passionate about software quality and automated tests.' },
  { email: 'kazi@teamup.com', fullName: 'Kazi Nazrul Islam', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'PyTorch'], bio: 'Revolutionary computational linguist developing open Bangla NLP tools.' },
  { email: 'jasim@teamup.com', fullName: 'Jasim Uddin', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Rural community tech advocate building simple and accessible mobile UIs.' },
  { email: 'shamsur@teamup.com', fullName: 'Shamsur Rahman', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'Architect designing clean domain-driven NestJS modules.' },
  { email: 'humayun@teamup.com', fullName: 'Humayun Ahmed', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Master storyteller and app architect creating engaging user experiences.' },
  { email: 'jafar@teamup.com', fullName: 'Muhammad Zafar Iqbal', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['Python', 'C++', 'IoT & Hardware'], bio: 'Science and technology mentor inspiring the next generation of coders.' },
  { email: 'selina@teamup.com', fullName: 'Selina Hossain', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['TypeScript', 'React Native', 'PostgreSQL'], bio: 'Researcher building collaborative historical and cultural archives.' },
  // Additional distinct names to reach 200:
  { email: 'abdullah@teamup.com', fullName: 'Abdullah Al Mamun', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Student developer building student group project tools.' },
  { email: 'mustafa@teamup.com', fullName: 'Mustafa Monwar', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Animation and visual effects enthusiast designing delightful mobile layouts.' },
  { email: 'munir@teamup.com', fullName: 'Munir Chowdhury', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Python', 'Machine Learning', 'Docker'], bio: 'Linguistics and computing researcher working on Bangla tokenizers.' },
  { email: 'zahir@teamup.com', fullName: 'Zahir Raihan', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'Node.js', 'PostgreSQL'], bio: 'Multimedia and documentary archivist building open-source media platforms.' },
  { email: 'tareque@teamup.com', fullName: 'Tareque Masud', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['TypeScript', 'React Native', 'Figma'], bio: 'Independent software producer passionate about social impact software.' },
  { email: 'abdur@teamup.com', fullName: 'Abdur Razzak', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Foundational backend engineer with deep understanding of SQL.' },
  { email: 'subhash@teamup.com', fullName: 'Subhash Dutta', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'Firebase'], bio: 'Mobile developer building educational quiz and study apps.' },
  { email: 'amjad@teamup.com', fullName: 'Amjad Hossain', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'Backend engineer focused on database indexing and API stability.' },
  { email: 'alamgir@teamup.com', fullName: 'Alamgir Hossain', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Python', 'Linux'], bio: 'Security researcher studying zero-trust models in student networks.' },
  { email: 'elias@teamup.com', fullName: 'Elias Kanchon', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Road safety and campus transport application developer.' },
  { email: 'manna@teamup.com', fullName: 'SM Aslam Talukder Manna', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Action-oriented full stack developer building high-impact tools.' },
  { email: 'salman_shah@teamup.com', fullName: 'Chowdhury Salman Shah', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Iconic style and UI design innovator.' },
  { email: 'bapparaj@teamup.com', fullName: 'Bapparaj Nayak', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Resilient backend developer handling unexpected error states gracefully.' },
  { email: 'ferdouz@teamup.com', fullName: 'Ferdous Ahmed', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Dart', 'Firebase'], bio: 'Cross-platform app engineer with clean design sensibilities.' },
  { email: 'riaz@teamup.com', fullName: 'Riaz Uddin Ahamed', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'TypeScript', 'PostgreSQL'], bio: 'Enterprise backend developer committed to clean architecture.' },
  { email: 'shakib_khan@teamup.com', fullName: 'Shakib Khan', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'High-energy lead developer building dominant consumer apps.' },
  { email: 'arifin@teamup.com', fullName: 'Arifin Shuvoo', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'Node.js', 'Figma'], bio: 'Fitness and activity tracking mobile developer.' },
  { email: 'mosharraf@teamup.com', fullName: 'Mosharraf Karim', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Python', 'Machine Learning', 'Docker'], bio: 'Versatile programmer adapting to any tech stack or project need.' },
  { email: 'chanchal@teamup.com', fullName: 'Chanchal Chowdhury', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['TypeScript', 'React Native', 'NestJS'], bio: 'Deeply nuanced engineer building high-precision software systems.' },
  { email: 'ziaul@teamup.com', fullName: 'Ziaul Faruq Apurba', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Polished romantic comedy app and social matching designer.' },
  { email: 'afran@teamup.com', fullName: 'Afran Nisho', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Python', 'Go'], bio: 'Intense and dedicated systems engineer with deep domain focus.' },
  { email: 'tahsan@teamup.com', fullName: 'Tahsan Rahman Khan', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'TypeScript'], bio: 'Harmonious designer and developer building melodious user experiences.' },
  { email: 'mehazabien@teamup.com', fullName: 'Mehazabien Chowdhury', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Star mobile engineer delivering top-rated Play Store student applications.' },
  { email: 'tanjin@teamup.com', fullName: 'Tanjin Tisha', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Elegant UI designer crafting modern glassmorphic and minimal interfaces.' },
  { email: 'sabit@teamup.com', fullName: 'Sabit Rahman', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Junior developer enthusiastic about learning mobile state management.' },
  { email: 'nabila@teamup.com', fullName: 'Masuma Rahman Nabila', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'Figma', 'TypeScript'], bio: 'Product engineer focused on clear communication and presentation.' },
  { email: 'sabila@teamup.com', fullName: 'Sabila Nur', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'PostgreSQL'], bio: 'Spirited mobile developer building dynamic campus community hubs.' },
  { email: 'safik@teamup.com', fullName: 'Safikul Islam', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Eager student looking to learn git branch management.' },
  { email: 'mithila@teamup.com', fullName: 'Rafiath Rashid Mithila', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['Education Tech', 'TypeScript', 'NestJS'], bio: 'Early childhood and university educational technology specialist.' },
  { email: 'ayman@teamup.com', fullName: 'Ayman Sadiq', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Education Tech', 'React Native', 'TypeScript'], bio: 'EdTech innovator passionate about gamified peer learning.' },
  { email: 'munzereen@teamup.com', fullName: 'Munzereen Shahid', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['Education Tech', 'UI/UX', 'Figma'], bio: 'English and communication skills app creator for university students.' },
  { email: 'sadik@teamup.com', fullName: 'Sadik Rahman', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Student programmer looking to build portfolio projects.' },
  { email: 'nafis@teamup.com', fullName: 'Nafis Sadik', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Go', 'PostgreSQL', 'Docker'], bio: 'Backend developer focused on distributed database indexing.' },
  { email: 'tanzeem@teamup.com', fullName: 'Tanzeem Chowdhury', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Mobile developer building study scheduler apps.' },
  { email: 'faiza@teamup.com', fullName: 'Faiza Nawar', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['UI/UX', 'Figma', 'HTML/CSS'], bio: 'Junior designer passionate about student-friendly visual interfaces.' },
  { email: 'tasnimul@teamup.com', fullName: 'Tasnimul Hasan', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'PyTorch'], bio: 'Machine learning specialist focused on audio classification.' },
  { email: 'adnan@teamup.com', fullName: 'Adnan Sami', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'Backend engineer focused on database transactions and integrity.' },
  { email: 'shabab@teamup.com', fullName: 'Shabab Murshid', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Beginner student looking for teammate matching on projects.' },
  { email: 'mahmuda@teamup.com', fullName: 'Mahmuda Begum', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Linux', 'Python'], bio: 'Network defense researcher auditing university wireless endpoints.' },
  { email: 'zarif@teamup.com', fullName: 'Zarif Almas', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Dart', 'Firebase'], bio: 'Cross-platform app engineer creating calendar scheduling widgets.' },
  { email: 'mashiat@teamup.com', fullName: 'Mashiat Tabassum', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Junior developer keen on participating in university hackathons.' },
  { email: 'wahed@teamup.com', fullName: 'Wahedul Haque', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Enterprise backend developer building high-volume services.' },
  { email: 'zaheen@teamup.com', fullName: 'Zaheen Faruq', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Figma'], bio: 'Mobile developer building responsive cards and segmented controls.' },
  { email: 'farah@teamup.com', fullName: 'Farah Diba', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['UI/UX', 'Figma', 'HTML/CSS'], bio: 'Designer focusing on accessibility guidelines and clean color tokens.' },
  { email: 'abid@teamup.com', fullName: 'Abid Hasan', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Go', 'Docker', 'Kubernetes'], bio: 'Infrastructure engineer automating multi-stage deployment workflows.' },
  { email: 'samia@teamup.com', fullName: 'Samia Sharmin', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Backend data pipeline engineer working on analytical aggregators.' },
  { email: 'alvee@teamup.com', fullName: 'Alvee Rahman', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Student programmer looking to build strong backend foundations.' },
  { email: 'shayan@teamup.com', fullName: 'Shayan Chowdhury', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'Senior API engineer building real-time collaboration engines.' },
  { email: 'nandita@teamup.com', fullName: 'Nandita Das', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Full-stack developer building student study group finders.' },
  { email: 'priyanka@teamup.com', fullName: 'Priyanka Ghosh', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['UI/UX', 'Figma', 'HTML/CSS'], bio: 'Creative designer exploring modern UI aesthetics and layouts.' },
  { email: 'tamzid@teamup.com', fullName: 'Tamzid Ahmed', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'PyTorch'], bio: 'Computer vision specialist working on handwritten digit recognition.' },
  { email: 'maruf@teamup.com', fullName: 'Maruf Hossain', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'PostgreSQL'], bio: 'Mobile developer building sports and fitness utilities for students.' },
  { email: 'ishita@teamup.com', fullName: 'Ishita Roy', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Junior developer looking to collaborate on university club apps.' },
  { email: 'monjur@teamup.com', fullName: 'Monjurul Islam', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Python', 'Linux'], bio: 'Information security researcher analyzing campus Wi-Fi policies.' },
  { email: 'anindya@teamup.com', fullName: 'Anindya Sundar', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Figma'], bio: 'Mobile developer building responsive cards and segmented controls.' },
  { email: 'tanushree@teamup.com', fullName: 'Tanushree Ghosh', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Beginner programmer seeking teammates for semester app challenges.' },
  { email: 'saad@teamup.com', fullName: 'Saadman Sakib', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['NestJS', 'PostgreSQL', 'Docker'], bio: 'Backend engineer focused on database transaction isolation.' },
  { email: 'tasmia@teamup.com', fullName: 'Tasmia Zaman', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Designer focusing on student productivity tools and task boards.' },
  { email: 'sayem@teamup.com', fullName: 'Sayem Ahmed', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Student developer learning relational queries and REST APIs.' },
  { email: 'mouly@teamup.com', fullName: 'Mouly Rahman', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['React Native', 'TypeScript', 'NestJS'], bio: 'Full-stack developer building real-time student team matching.' },
  { email: 'arifur@teamup.com', fullName: 'Arifur Rahman', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Go', 'PostgreSQL', 'Docker'], bio: 'Backend developer focused on concurrency and low-latency APIs.' },
  { email: 'sheba@teamup.com', fullName: 'Sheba Chowdhury', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Junior developer looking to build strong backend foundations.' },
  { email: 'mahbub@teamup.com', fullName: 'Mahbub Alam', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Java', 'Spring Boot', 'PostgreSQL'], bio: 'Senior software engineering student building fault-tolerant backend services.' },
  { email: 'nipa@teamup.com', fullName: 'Nipa Akter', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Dart', 'Firebase'], bio: 'Mobile developer building study scheduler apps with calendar integrations.' },
  { email: 'shohan@teamup.com', fullName: 'Shohanur Rahman', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['UI/UX', 'Figma', 'HTML/CSS'], bio: 'Junior designer passionate about student-friendly visual interfaces.' },
  { email: 'trisha@teamup.com', fullName: 'Trisha Paul', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Machine Learning', 'Python', 'TensorFlow'], bio: 'AI researcher focused on Bangla speech processing and audio recognition.' },
  { email: 'shawon@teamup.com', fullName: 'Shawon Mahmud', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'TypeScript', 'Node.js'], bio: 'Mobile developer experienced in state management and offline synchronization.' },
  { email: 'urmi@teamup.com', fullName: 'Urmi Akter', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['Python', 'SQL', 'Git'], bio: 'Data analysis enthusiast exploring student project statistics.' },
  { email: 'noyon@teamup.com', fullName: 'Noyon Ali', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['CyberSecurity', 'Linux', 'Python'], bio: 'Security specialist auditing authentication and JWT rotation flows.' },
  { email: 'shanta_akter@teamup.com', fullName: 'Shanta Akter', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['NestJS', 'PostgreSQL', 'TypeScript'], bio: 'API engineer who values strong typing and relational data integrity.' },
  { email: 'zubaer@teamup.com', fullName: 'Zubaer Hossain', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['JavaScript', 'HTML/CSS', 'Git'], bio: 'Junior developer looking to collaborate on university club apps.' },
  { email: 'kanta@teamup.com', fullName: 'Kanta Das', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Design lead with expertise in interactive design and design systems.' },
  { email: 'sojib@teamup.com', fullName: 'Sojib Ahmed', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Python', 'PostgreSQL', 'Docker'], bio: 'Backend data engineer working on campus bus tracking APIs.' },
  { email: 'shorna@teamup.com', fullName: 'Shorna Roy', department: 'Software Engineering', semester: 'Spring 2026', level: ExperienceLevel.BEGINNER, primarySkills: ['UI/UX', 'Figma', 'HTML/CSS'], bio: 'Creative designer interested in user research and prototyping.' },
  { email: 'partha@teamup.com', fullName: 'Partha Pratim', department: 'Information & Communication Technology', semester: 'Fall 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['Go', 'Docker', 'Kubernetes'], bio: 'Infrastructure engineer automating CI workflows and container builds.' },
  { email: 'rumana_akter@teamup.com', fullName: 'Rumana Akter', department: 'Computer Science & Engineering', semester: 'Spring 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['Flutter', 'Node.js', 'Firebase'], bio: 'Mobile developer building real-time collaboration apps.' },
  { email: 'ananta@teamup.com', fullName: 'Ananta Jalil', department: 'Software Engineering', semester: 'Fall 2026', level: ExperienceLevel.ADVANCED, primarySkills: ['TypeScript', 'React Native', 'NestJS'], bio: 'High-production value tech lead who makes impossible projects possible.' },
  { email: 'barsha@teamup.com', fullName: 'Afiea Nusrat Barsha', department: 'Information & Communication Technology', semester: 'Spring 2025', level: ExperienceLevel.ADVANCED, primarySkills: ['UI/UX', 'Figma', 'React Native'], bio: 'Design partner and mobile software specialist.' },
  { email: 'hero_alom@teamup.com', fullName: 'Ashraful Hossen Alom', department: 'Computer Science & Engineering', semester: 'Fall 2026', level: ExperienceLevel.INTERMEDIATE, primarySkills: ['React Native', 'Social Media API', 'TypeScript'], bio: 'Viral sensation building viral student content and voting apps.' },
];

async function main() {
  console.log(`Starting database seed with ${BANGLADESHI_NAMES.length} Bangladeshi student users...`);

  // 1. Seed Skills Catalog
  const skillCatalog = [
    { name: 'React Native', category: 'Mobile' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Python', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'NestJS', category: 'Backend' },
    { name: 'Figma', category: 'Design' },
    { name: 'UI/UX', category: 'Design' },
    { name: 'Flutter', category: 'Mobile' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Go', category: 'Backend' },
    { name: 'Java', category: 'Backend' },
    { name: 'Spring Boot', category: 'Backend' },
    { name: 'Machine Learning', category: 'AI & Data' },
    { name: 'TensorFlow', category: 'AI & Data' },
    { name: 'PyTorch', category: 'AI & Data' },
    { name: 'CyberSecurity', category: 'Security' },
    { name: 'Tailwind CSS', category: 'Frontend' },
    { name: 'Next.js', category: 'Frontend' },
    { name: 'GraphQL', category: 'Backend' },
    { name: 'Redis', category: 'Database' },
    { name: 'Kubernetes', category: 'DevOps' },
    { name: 'IoT & Hardware', category: 'Hardware' },
    { name: 'Agile Leadership', category: 'Management' },
    { name: 'Education Tech', category: 'Domain' },
    { name: 'C++', category: 'Language' },
    { name: 'Firebase', category: 'Cloud' },
    { name: 'Django', category: 'Backend' },
    { name: 'Linux', category: 'DevOps' },
    { name: 'SQL', category: 'Database' },
  ];

  const skillMap: Record<string, string> = {};
  for (const s of skillCatalog) {
    const record = await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category },
      create: { name: s.name, category: s.category },
    });
    skillMap[s.name] = record.id;
  }
  console.log(`Skills verified: ${Object.keys(skillMap).length}`);

  // 2. Hash Password once for high seeding performance
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. Seed Users & Profiles
  const userMap: Record<string, string> = {}; // email -> userId

  for (let i = 0; i < BANGLADESHI_NAMES.length; i++) {
    const spec = BANGLADESHI_NAMES[i];
    const usernameSlug = spec.email.replace('@teamup.com', '');
    const repos = 6 + (i * 3) % 45;
    const contributions = 75 + (i * 17) % 650;
    const stars = 3 + (i * 7) % 80;

    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        password: hashedPassword,
        isVerified: true,
        profile: {
          upsert: {
            create: {
              fullName: spec.fullName,
              bio: spec.bio,
              department: spec.department,
              semester: spec.semester,
              experienceLevel: spec.level,
              availability: true,
              githubUsername: `${usernameSlug}-dev`,
              githubStats: {
                publicRepos: repos,
                contributionsThisYear: contributions,
                totalStars: stars,
                topLanguages: spec.primarySkills.slice(0, 3),
              },
            },
            update: {
              fullName: spec.fullName,
              bio: spec.bio,
              department: spec.department,
              semester: spec.semester,
              experienceLevel: spec.level,
              availability: true,
            },
          },
        },
      },
      create: {
        email: spec.email,
        password: hashedPassword,
        isVerified: true,
        profile: {
          create: {
            fullName: spec.fullName,
            bio: spec.bio,
            department: spec.department,
            semester: spec.semester,
            experienceLevel: spec.level,
            availability: true,
            githubUsername: `${usernameSlug}-dev`,
            githubStats: {
              publicRepos: repos,
              contributionsThisYear: contributions,
              totalStars: stars,
              topLanguages: spec.primarySkills.slice(0, 3),
            },
          },
        },
      },
      include: { profile: true },
    });

    userMap[spec.email] = user.id;

    // Link user skills
    if (user.profile) {
      for (const skillName of spec.primarySkills) {
        const skillId = skillMap[skillName];
        if (skillId) {
          await prisma.profileSkill.upsert({
            where: {
              profileId_skillId: {
                profileId: user.profile.id,
                skillId,
              },
            },
            update: {
              proficiencyLevel: spec.level,
              yearsOfExperience: spec.level === ExperienceLevel.ADVANCED ? 3 : spec.level === ExperienceLevel.INTERMEDIATE ? 2 : 1,
            },
            create: {
              profileId: user.profile.id,
              skillId,
              proficiencyLevel: spec.level,
              yearsOfExperience: spec.level === ExperienceLevel.ADVANCED ? 3 : spec.level === ExperienceLevel.INTERMEDIATE ? 2 : 1,
            },
          });
        }
      }
    }
  }

  console.log(`Seeded ${Object.keys(userMap).length} users successfully! All passwords set to: password123`);

  // Ensure default test user alias 'testuser@example.com' exists as Mahin Khan for backwards-compatibility
  await prisma.user.upsert({
    where: { email: 'testuser@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'testuser@example.com',
      password: hashedPassword,
      profile: {
        create: {
          fullName: 'Mahin Khan',
          bio: 'CS Student & TeamUp Creator',
          department: 'Computer Science & Engineering',
          semester: 'Fall 2026',
          experienceLevel: ExperienceLevel.ADVANCED,
          availability: true,
        },
      },
    },
  });

  const tanvirId = userMap['tanvir@teamup.com'];
  const sadiaId = userMap['sadia@teamup.com'];
  const rahimId = userMap['rahim@teamup.com'];
  const tahmidId = userMap['tahmid@teamup.com'];
  const anikaId = userMap['anika@teamup.com'];
  const nusratId = userMap['nusrat@teamup.com'];
  const mehediId = userMap['mehedi@teamup.com'];
  const farhanId = userMap['farhan@teamup.com'];

  // 4. Seed Diverse Bangladeshi University Projects
  const PROJECTS_DATA = [
    {
      id: 'project-1',
      title: 'AI Study Buddy & Collaboration Hub',
      description: 'Unified cross-platform mobile and web application for university students to form teams, review GitHub code, and schedule sprints.',
      domain: 'Education & AI',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 5,
      creatorId: tanvirId,
      required: ['React Native', 'TypeScript', 'NestJS', 'PostgreSQL'],
      members: [
        { email: 'tanvir@teamup.com', role: ProjectRole.LEADER },
        { email: 'sadia@teamup.com', role: ProjectRole.MEMBER },
        { email: 'rahim@teamup.com', role: ProjectRole.MEMBER },
      ],
    },
    {
      id: 'project-2',
      title: 'Campus Food Delivery & Meal Share',
      description: 'Peer-to-peer campus food ordering and meal delivery app connecting cafeteria kitchens with dorm students.',
      domain: 'Community & Logistics',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      creatorId: sadiaId,
      required: ['Flutter', 'Python', 'PostgreSQL'],
      members: [
        { email: 'sadia@teamup.com', role: ProjectRole.LEADER },
        { email: 'tahmid@teamup.com', role: ProjectRole.MEMBER },
      ],
    },
    {
      id: 'project-3',
      title: 'Smart Campus IoT Energy Monitor',
      description: 'IoT sensor network monitoring power consumption, AC automation, and solar feed efficiency across campus lab rooms.',
      domain: 'IoT & Hardware',
      semester: 'Spring 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      creatorId: rahimId,
      required: ['Python', 'Docker', 'IoT & Hardware'],
      members: [
        { email: 'rahim@teamup.com', role: ProjectRole.LEADER },
        { email: 'karim@teamup.com', role: ProjectRole.MEMBER },
      ],
    },
    {
      id: 'project-4',
      title: 'Dhaka Metro Transit Pass & Smart Route Planner',
      description: 'Transit mobile application with real-time train timings, NFC smartcard balance check, and crowd density prediction.',
      domain: 'Urban Mobility',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      creatorId: tahmidId,
      required: ['React Native', 'TypeScript', 'Node.js'],
      members: [
        { email: 'tahmid@teamup.com', role: ProjectRole.LEADER },
        { email: 'anika@teamup.com', role: ProjectRole.MEMBER },
      ],
    },
    {
      id: 'project-5',
      title: 'Bangla NLP Sentiment Analysis & Translation Toolkit',
      description: 'Open-source transformer model for Bangla-to-English translation and university social forum sentiment analysis.',
      domain: 'AI & Data',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      creatorId: anikaId,
      required: ['Machine Learning', 'Python', 'PyTorch'],
      members: [
        { email: 'anika@teamup.com', role: ProjectRole.LEADER },
        { email: 'nusrat@teamup.com', role: ProjectRole.MEMBER },
      ],
    },
    {
      id: 'project-6',
      title: 'BoiBitan — Peer-to-Peer Academic Textbook Exchange',
      description: 'Digital student exchange to rent, buy, or borrow textbooks, notes, and lab manuals directly within university campuses.',
      domain: 'Education',
      semester: 'Spring 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 3,
      creatorId: nusratId,
      required: ['React Native', 'NestJS', 'PostgreSQL'],
      members: [
        { email: 'nusrat@teamup.com', role: ProjectRole.LEADER },
        { email: 'mehedi@teamup.com', role: ProjectRole.MEMBER },
      ],
    },
    {
      id: 'project-7',
      title: 'Smart Krishi — Deep Learning Crop Disease Diagnostics',
      description: 'Mobile camera scanner using PyTorch CNN models to detect leaf blights and pest damages in local crops with offline support.',
      domain: 'AgriTech & AI',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      creatorId: mehediId,
      required: ['Python', 'Machine Learning', 'Flutter'],
      members: [
        { email: 'mehedi@teamup.com', role: ProjectRole.LEADER },
        { email: 'farhan@teamup.com', role: ProjectRole.MEMBER },
      ],
    },
    {
      id: 'project-8',
      title: 'ShasthyaSheba — Rural Telemedicine & e-Prescription Portal',
      description: 'Low-bandwidth video consults and verified digital prescriptions connecting university medical clinics with rural patients.',
      domain: 'Healthcare',
      semester: 'Spring 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      creatorId: farhanId,
      required: ['NestJS', 'PostgreSQL', 'React Native'],
      members: [
        { email: 'farhan@teamup.com', role: ProjectRole.LEADER },
        { email: 'sabbir@teamup.com', role: ProjectRole.MEMBER },
      ],
    },
    {
      id: 'proj-101',
      title: 'AI Study Buddy & Collaboration Hub (Dev Workspace)',
      description: 'Testbed workspace for team scheduler slot voting, milestones, and push notifications.',
      domain: 'Education & AI',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      creatorId: tanvirId,
      required: ['React Native', 'TypeScript', 'NestJS'],
      members: [
        { email: 'tanvir@teamup.com', role: ProjectRole.LEADER },
      ],
    },
  ];

  for (const proj of PROJECTS_DATA) {
    const creator = proj.creatorId || tanvirId;
    const project = await prisma.project.upsert({
      where: { id: proj.id },
      update: {
        title: proj.title,
        description: proj.description,
        domain: proj.domain,
        semester: proj.semester,
        status: proj.status,
        maxMembers: proj.maxMembers,
      },
      create: {
        id: proj.id,
        title: proj.title,
        description: proj.description,
        domain: proj.domain,
        semester: proj.semester,
        status: proj.status,
        maxMembers: proj.maxMembers,
        creatorId: creator,
      },
    });

    // Required skills
    for (const skillName of proj.required) {
      const skillId = skillMap[skillName];
      if (skillId) {
        await prisma.projectRequiredSkill.upsert({
          where: {
            projectId_skillId: {
              projectId: project.id,
              skillId,
            },
          },
          update: { minimumExperience: ExperienceLevel.INTERMEDIATE },
          create: {
            projectId: project.id,
            skillId,
            minimumExperience: ExperienceLevel.INTERMEDIATE,
          },
        });
      }
    }

    // Members
    for (const m of proj.members) {
      const memberUserId = userMap[m.email];
      if (memberUserId) {
        await prisma.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: project.id,
              userId: memberUserId,
            },
          },
          update: {
            role: m.role,
            status: MemberStatus.ACCEPTED,
          },
          create: {
            projectId: project.id,
            userId: memberUserId,
            role: m.role,
            status: MemberStatus.ACCEPTED,
          },
        });
      }
    }

    // Seed Kanban tasks for active projects
    const existingTasksCount = await prisma.task.count({ where: { projectId: project.id } });
    if (existingTasksCount === 0) {
      await prisma.task.createMany({
        data: [
          {
            projectId: project.id,
            title: 'Design high-fidelity mobile wireframes in Figma',
            description: 'Define design tokens, colors, typography, and card components.',
            status: TaskStatus.DONE,
            priority: Priority.HIGH,
            assigneeId: sadiaId,
          },
          {
            projectId: project.id,
            title: 'Set up PostgreSQL Prisma schema & database migrations',
            description: 'Ensure normalized relational foreign keys and indices.',
            status: TaskStatus.IN_PROGRESS,
            priority: Priority.HIGH,
            assigneeId: rahimId,
          },
          {
            projectId: project.id,
            title: 'Implement JWT refresh token rotation with security guards',
            description: 'Write auth middleware and RBAC roles guard.',
            status: TaskStatus.TODO,
            priority: Priority.MEDIUM,
            assigneeId: tanvirId,
          },
          {
            projectId: project.id,
            title: 'Write Jest unit tests and verify 80% code coverage',
            description: 'Cover services and HTTP exception filters.',
            status: TaskStatus.TODO,
            priority: Priority.LOW,
            assigneeId: farhanId,
          },
        ],
      });
    }

    // Seed sample meeting with voting slots
    const existingMeeting = await prisma.meeting.findFirst({ where: { projectId: project.id } });
    if (!existingMeeting) {
      await prisma.meeting.create({
        data: {
          projectId: project.id,
          title: 'Sprint 1 Architecture & Task Sync',
          description: 'Vote on meeting time slot to align on technical specs and deliverables.',
          status: MeetingStatus.VOTING,
          slots: {
            create: [
              {
                startTime: new Date(Date.now() + 86400000), // +1 day
                endTime: new Date(Date.now() + 90000000),
              },
              {
                startTime: new Date(Date.now() + 172800000), // +2 days
                endTime: new Date(Date.now() + 176400000),
              },
            ],
          },
        },
      });
    }
  }

  // 5. Seed Community Idea Hub Posts
  const IDEAS_DATA = [
    {
      title: 'Automated Bangla Speech-to-Text for University Lectures',
      description: 'Speech recognition engine tuned for Bengali academic lectures and technical terms to generate study notes automatically.',
      domain: 'Education & AI',
      suggestedStack: ['Python', 'PyTorch', 'React Native'],
      authorEmail: 'anika@teamup.com',
    },
    {
      title: 'Campus Emergency Blood Donor Locator',
      description: 'Emergency geofenced blood donation network matching patient hospital blood requests with registered donor students.',
      domain: 'Healthcare',
      suggestedStack: ['React Native', 'NestJS', 'PostgreSQL', 'Redis'],
      authorEmail: 'sabbir@teamup.com',
    },
    {
      title: 'Crowdsourced Dhaka City Bus Route & Crowding Tracker',
      description: 'Real-time GPS bus location, seat availability, and fare calculator powered by student commuter check-ins.',
      domain: 'Community & Logistics',
      suggestedStack: ['Flutter', 'Node.js', 'PostgreSQL'],
      authorEmail: 'tahmid@teamup.com',
    },
    {
      title: 'Smart Solar Roof Energy Balancer for Student Hostels',
      description: 'Predictive algorithm that matches daytime solar generation with peak hostel laundry and charging schedules.',
      domain: 'IoT & Hardware',
      suggestedStack: ['Python', 'Docker', 'IoT & Hardware'],
      authorEmail: 'rahim@teamup.com',
    },
    {
      title: 'AI Resume & Portfolio Reviewer for CSE Graduates',
      description: 'LLM tool analyzing student GitHub repositories and LaTeX resumes against international software engineering standards.',
      domain: 'AI & Data',
      suggestedStack: ['NestJS', 'Python', 'TypeScript'],
      authorEmail: 'tanvir@teamup.com',
    },
  ];

  for (const idea of IDEAS_DATA) {
    const authorId = userMap[idea.authorEmail] || tanvirId;
    const existing = await prisma.idea.findFirst({ where: { title: idea.title } });
    if (!existing) {
      await prisma.idea.create({
        data: {
          title: idea.title,
          description: idea.description,
          domain: idea.domain,
          suggestedStack: idea.suggestedStack,
          authorId,
        },
      });
    }
  }

  console.log('Seeded projects, tasks, meetings, and ideas successfully!');
  console.log('----------------------------------------------------');
  console.log('SEED SUMMARY:');
  console.log(`Total Users: ${BANGLADESHI_NAMES.length} Bangladeshi student accounts`);
  console.log('Default Password for all: password123');
  console.log('Sample logins:');
  console.log('  - tanvir@teamup.com');
  console.log('  - sadia@teamup.com');
  console.log('  - rahim@teamup.com');
  console.log('  - anika@teamup.com');
  console.log('  - tahmid@teamup.com');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
