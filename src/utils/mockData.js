/**
 * Realistic Mock Data for Professional Journalist Portfolio
 * Used as fallback when API is not available or for development
 */

import { USER_NAME } from "../config/constants";

export const mockProfile = {
  name: `${USER_NAME}`,
  title: 'Award-Winning Investigative Journalist',
  headline: 'Investigative Reporter | Documentary Filmmaker | Media Consultant',
  short_bio: 'Award-winning investigative journalist with over 15 years of experience uncovering truth and telling stories that matter. Specialized in political corruption, human rights, and environmental issues.',
  bio: `${USER_NAME} is an award-winning investigative journalist with over 15 years of experience in uncovering truth and telling stories that matter. Her work has been featured in major publications including The New York Times, The Guardian, and BBC News.

She specializes in political corruption, human rights violations, and environmental issues. Her investigative series on corporate environmental violations won the Pulitzer Prize for Investigative Reporting in 2020.

Sarah has reported from over 40 countries, covering conflicts, political upheavals, and social justice movements. Her documentary work has been screened at international film festivals and has influenced policy changes in multiple countries.

She holds a Master's degree in Journalism from Columbia University and is a member of the International Consortium of Investigative Journalists (ICIJ).`,
  profile_image_url: 'https://i.postimg.cc/qqYgkRYp/profile.png',
  email: 'sugyan.sagar@journalist.com',
  phone: '+1 (555) 123-4567',
  location: 'New York, USA',
  website: 'https://sarahmitchell.com',
  experience: '15+ years of investigative journalism experience',
  education: 'M.A. Journalism, Columbia University | B.A. Political Science, Harvard University',
  languages: 'English (Native), Spanish (Fluent), French (Conversational), Arabic (Basic)',
  specializations: 'Investigative Reporting, Political Corruption, Human Rights, Environmental Journalism, Documentary Filmmaking',
  awards: 'Pulitzer Prize for Investigative Reporting (2020), Peabody Award (2019), Edward R. Murrow Award (2018), Overseas Press Club Award (2017)',
  resume_url: '#',
};

export const mockSocialLinks = [
  { id: 1, platform: 'Twitter', url: 'https://twitter.com/sarahmitchell', icon: '🐦', is_active: true },
  { id: 2, platform: 'LinkedIn', url: 'https://linkedin.com/in/sarahmitchell', icon: '💼', is_active: true },
  { id: 3, platform: 'Instagram', url: 'https://instagram.com/sarahmitchell', icon: '📷', is_active: true },
  { id: 4, platform: 'YouTube', url: 'https://youtube.com/@sarahmitchell', icon: '📺', is_active: true },
  { id: 5, platform: 'Email', url: 'mailto:sarah.mitchell@journalist.com', icon: '✉️', is_active: true },
];

// mockPosts and mockCategories removed - these are now fully dynamic from the API

export const mockStats = {
  totalStories: 58,
  countriesCovered: 42,
  awards: 12,
  yearsExperience: 15,
  publications: ['The New York Times', 'The Guardian', 'BBC News', 'Reuters', 'Associated Press', 'The Washington Post'],
};

export const mockAwards = [
  { year: 2020, award: 'Pulitzer Prize for Investigative Reporting', organization: 'Columbia University' },
  { year: 2019, award: 'Peabody Award', organization: 'University of Georgia' },
  { year: 2018, award: 'Edward R. Murrow Award', organization: 'RTDNA' },
  { year: 2017, award: 'Overseas Press Club Award', organization: 'OPC' },
  { year: 2016, award: 'Goldsmith Prize for Investigative Reporting', organization: 'Harvard Kennedy School' },
];

export const mockPublications = [
  { name: 'The New York Times', logo: '📰', articles: 24 },
  { name: 'The Guardian', logo: '📖', articles: 18 },
  { name: 'BBC News', logo: '📺', articles: 15 },
  { name: 'Reuters', logo: '📡', articles: 12 },
  { name: 'Associated Press', logo: '📰', articles: 10 },
  { name: 'The Washington Post', logo: '📰', articles: 8 },
];












