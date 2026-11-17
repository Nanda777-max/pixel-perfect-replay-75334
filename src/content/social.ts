// My social profiles. Edit them here only: the header, the menu, the About panel and the
// laptop's GitHub workspace all read from this list.
export interface SocialLink {
  id: 'github' | 'linkedin' | 'instagram';
  label: string;
  url: string;
  handle: string;
}

export const socialLinks: SocialLink[] = [
  { id: 'github', label: 'GitHub', url: 'https://github.com/Nanda777-max', handle: 'Nanda777-max' },
  { id: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/nanda-kishor-s-3286381b4', handle: 'nanda-kishor-s' },
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/nks_core/', handle: 'nks_core' },
];

export const github = socialLinks.find(l => l.id === 'github')!;

/**
 * My GitHub profile picture, served by GitHub. The number is my GitHub account ID (from
 * https://api.github.com/users/Nanda777-max), so this address always shows whatever avatar is
 * currently set on GitHub. To use a different picture, put a URL or a path such as
 * '/images/profile/github-avatar.jpg' here.
 */
export const githubAvatar = 'https://avatars.githubusercontent.com/u/65392752?v=4';
