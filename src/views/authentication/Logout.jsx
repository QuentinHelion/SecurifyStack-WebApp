import React, { useEffect } from 'react';
import Cookies from "js-cookie";
import { useNavigate  } from 'react-router-dom';


const Logout = () => {
    const navigate = useNavigate();
    useEffect(() => {
        Cookies.remove('token');
        navigate('/auth/login');
    });

    return (
        <div>
            Logging out...
        </div>
    );
}

export default Logout;