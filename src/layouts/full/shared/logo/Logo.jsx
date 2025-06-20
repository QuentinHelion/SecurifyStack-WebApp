import { Link } from 'react-router-dom';
import LogoDark from 'src/assets/images/logos/dark-logo.svg?react';
import { styled } from '@mui/material';

const LinkStyled = styled(Link)(() => ({
  height: '250px',
  width: '250px',
  overflow: 'hidden',
  display: 'block',
}));

const Logo = () => {
  return (
    <LinkStyled to="/">
      <LogoDark height={200} />
    </LinkStyled>
  )
};

export default Logo;
