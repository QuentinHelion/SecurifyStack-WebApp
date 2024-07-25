import {
  IconLayoutDashboard, IconLogin, IconChecks,
  IconSettingsAutomation
} from '@tabler/icons';

import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Home',
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    id: uniqueId(),
    title: 'Checklist',
    icon: IconChecks,
    href: '/checklist',
  },
  {
    id: uniqueId(),
    title: 'Deploy VMs',
    icon: IconSettingsAutomation,
    href: '/form',
  },
  {
    navlabel: true,
    subheader: 'Auth',
  },
  {
    id: uniqueId(),
    title: 'Logout',
    icon: IconLogin,
    href: '/auth/logout',
  },
];

export default Menuitems;
