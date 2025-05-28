import IconLayoutDashboard from '@tabler/icons-react/dist/esm/icons/IconLayoutDashboard';
import IconLogin from '@tabler/icons-react/dist/esm/icons/IconLogin';
import IconChecks from '@tabler/icons-react/dist/esm/icons/IconChecks';
import IconSettingsAutomation from '@tabler/icons-react/dist/esm/icons/IconSettingsAutomation';
import IconDeviceImac from '@tabler/icons-react/dist/esm/icons/IconDeviceImac';

import uniqueId from 'lodash/uniqueId';

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
