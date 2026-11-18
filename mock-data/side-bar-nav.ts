import { Inbox, FolderKanban, ContactRound, Box, UserRound } from 'lucide-react';

export const inboxItems = [
   {
      name: 'Inbox',
      url: '/lndev-ui/inbox',
      icon: Inbox,
   },
   {
      name: 'My issues',
      url: '/lndev-ui/my-issues',
      icon: FolderKanban,
   },
];

export const workspaceItems = [
   {
      name: 'Teams',
      url: '/lndev-ui/teams',
      icon: ContactRound,
   },
   {
      name: 'Projects',
      url: '/lndev-ui/projects',
      icon: Box,
   },
   {
      name: 'Members',
      url: '/lndev-ui/members',
      icon: UserRound,
   },
];
