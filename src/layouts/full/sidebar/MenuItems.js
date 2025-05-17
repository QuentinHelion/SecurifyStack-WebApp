import {
  IconLayoutDashboard, IconLogin, IconChecks,
  IconSettingsAutomation,
  IconDeviceImac
} from '@tabler/icons-react';

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
    id: uniqueId(),
    title: 'Conceptify',
    icon: IconDeviceImac,
    href: '/conceptify',
    external: true,
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
