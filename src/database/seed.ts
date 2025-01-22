import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User } from '../entities/user.entity';
import { Opportunity } from '../entities/opportunity.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Application } from 'src/entities/application.entity';

const bulgarianCompanies = [
  {
    name: 'Chaos Group',
    email: 'careers@chaosgroup.com',
    firstName: 'Peter',
    lastName: 'Mitev',
  },
  {
    name: 'Progress',
    email: 'careers@progress.com',
    firstName: 'Svetozar',
    lastName: 'Georgiev',
  },
  {
    name: 'Telerik Academy',
    email: 'careers@telerikacademy.com',
    firstName: 'Alexandra',
    lastName: 'Mechkova',
  },
  {
    name: 'SoftUni',
    email: 'careers@softuni.bg',
    firstName: 'Svetlin',
    lastName: 'Nakov',
  },
  {
    name: 'ScaleFocus',
    email: 'careers@scalefocus.com',
    firstName: 'Plamen',
    lastName: 'Tsekov',
  },
];

const bulgarianCandidates = [
  { firstName: 'Ivan', lastName: 'Dimitrov' },
  { firstName: 'Maria', lastName: 'Petrova' },
  { firstName: 'Georgi', lastName: 'Ivanov' },
  { firstName: 'Elena', lastName: 'Todorova' },
  { firstName: 'Stefan', lastName: 'Angelov' },
];

const bulgarianLocations = [
  { city: 'Sofia', coordinates: '42.697839,23.321670' },
  { city: 'Plovdiv', coordinates: '42.144920,24.748220' },
  { city: 'Varna', coordinates: '43.214050,27.914733' },
  { city: 'Burgas', coordinates: '42.510578,27.461014' },
  { city: 'Ruse', coordinates: '43.856258,25.974375' },
];

const jobTemplates = {
  'full-time': [
    {
      title: 'Senior Software Engineer',
      description: `We are looking for a Senior Software Engineer to join our team and help us build scalable solutions.

Key Responsibilities:
• Design and implement new features for our core products
• Mentor junior developers and conduct code reviews
• Collaborate with cross-functional teams to define and implement solutions
• Participate in architectural decisions

Requirements:
• 5+ years of experience in software development
• Strong knowledge of JavaScript/TypeScript, React, and Node.js
• Experience with cloud services (AWS/Azure/GCP)
• Excellent problem-solving and communication skills`,
    },
    {
      title: 'Frontend Developer',
      description: `Join our frontend team to create exceptional user experiences.

Key Responsibilities:
• Develop responsive web applications using modern frameworks
• Optimize applications for maximum speed and scalability
• Collaborate with UI/UX designers to implement designs
• Write clean, maintainable code

Requirements:
• 3+ years of experience with modern JavaScript
• Proficiency in React.js and TypeScript
• Experience with state management solutions
• Understanding of cross-browser compatibility`,
    },
    {
      title: 'DevOps Engineer',
      description: `We're seeking a DevOps Engineer to help us automate and improve our development and deployment processes.

Key Responsibilities:
• Manage and optimize our CI/CD pipelines
• Monitor system performance and reliability
• Implement security best practices
• Automate manual processes

Requirements:
• Experience with Docker and Kubernetes
• Knowledge of cloud platforms (AWS/Azure)
• Strong scripting abilities
• Understanding of security best practices`,
    },
  ],
  internship: [
    {
      title: 'Junior Developer Intern',
      description: `Join our team as a Junior Developer Intern and kick-start your career in software development.

What you'll learn:
• Modern web development practices
• Working with React and TypeScript
• Version control with Git
• Agile development processes

Requirements:
• Basic knowledge of JavaScript
• Understanding of HTML and CSS
• Eagerness to learn and grow
• Currently pursuing or recently graduated with a CS degree`,
    },
    {
      title: 'QA Engineering Intern',
      description: `Start your QA career with us and learn modern testing practices.

What you'll learn:
• Manual and automated testing techniques
• Test planning and execution
• Bug reporting and tracking
• Testing tools and frameworks

Requirements:
• Basic understanding of software testing
• Attention to detail
• Good analytical skills
• Interest in quality assurance`,
    },
    {
      title: 'UI/UX Design Intern',
      description: `Get hands-on experience in UI/UX design and work on real projects.

What you'll learn:
• User interface design principles
• Prototyping and wireframing
• User research methods
• Design tools and workflows

Requirements:
• Basic design skills
• Knowledge of design tools
• Creative mindset
• Interest in user experience`,
    },
  ],
};

function generateBulgarianPhoneNumber(): string {
  const prefix = '088';
  const randomDigits = Array.from({ length: 7 }, () =>
    Math.floor(Math.random() * 10),
  ).join('');
  return prefix + randomDigits;
}

function getRandomSalary(type: 'internship' | 'full-time'): number {
  if (type === 'internship') {
    return Math.floor(Math.random() * 500) + 800; // 800-1300 BGN for internships
  }
  return Math.floor(Math.random() * 2000) + 3000; // 3000-5000 BGN for full-time
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get('UserRepository') as Repository<User>;
  const opportunityRepository = app.get(
    'OpportunityRepository',
  ) as Repository<Opportunity>;
  const applicationRepository = app.get(
    'ApplicationRepository',
  ) as Repository<Application>;

  try {
    await applicationRepository.delete({});
    await opportunityRepository.delete({});
    await userRepository.delete({});
  } catch (error) {
    console.error('Error clearing existing data: ', error);
    throw error;
  }

  const hashedPassword = await bcrypt.hash('123456', 10);

  await userRepository.save({
    firstName: 'Admin',
    lastName: 'One',
    email: 'admin1@example.com',
    password: hashedPassword,
    role: UserRole.ADMIN,
  });

  await userRepository.save({
    firstName: 'Admin',
    lastName: 'Two',
    email: 'admin2@example.com',
    password: hashedPassword,
    role: UserRole.ADMIN,
  });

  const partners = [];
  for (const company of bulgarianCompanies) {
    partners.push(
      await userRepository.save({
        firstName: company.firstName,
        lastName: company.lastName,
        email: company.email,
        password: hashedPassword,
        role: UserRole.PARTNER,
        companyName: company.name,
        companyCoordinates: bulgarianLocations[partners.length].coordinates,
        phoneNumber: generateBulgarianPhoneNumber(),
        subscriptionStatus: "active"
      }),
    );
  }

  for (const candidate of bulgarianCandidates) {
    const email = `${candidate.firstName.toLowerCase()}.${candidate.lastName.toLowerCase()}@example.com`;
    await userRepository.save({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: email,
      password: hashedPassword,
      role: UserRole.CANDIDATE,
      phoneNumber: generateBulgarianPhoneNumber(),
    });
  }

  for (const partner of partners) {
    const fullTimeCount = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < fullTimeCount; i++) {
      const template =
        jobTemplates['full-time'][
          Math.floor(Math.random() * jobTemplates['full-time'].length)
        ];
      await opportunityRepository.save({
        title: template.title,
        description: template.description,
        location:
          bulgarianLocations[
            Math.floor(Math.random() * bulgarianLocations.length)
          ].city,
        salary: getRandomSalary('full-time'),
        type: 'full-time',
        company: partner,
      });
    }

    const internshipCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < internshipCount; i++) {
      const template =
        jobTemplates['internship'][
          Math.floor(Math.random() * jobTemplates['internship'].length)
        ];
      await opportunityRepository.save({
        title: template.title,
        description: template.description,
        location:
          bulgarianLocations[
            Math.floor(Math.random() * bulgarianLocations.length)
          ].city,
        salary: getRandomSalary('internship'),
        type: 'internship',
        company: partner,
      });
    }
  }

  console.log('Seeding completed!');
  await app.close();
}

bootstrap().catch((error) => {
  console.error('Error seeding database:', error);
});
