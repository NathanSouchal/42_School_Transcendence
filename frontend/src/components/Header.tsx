import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <div className="">
      <div className="text-capitalize h3 mb-4 w-100 text-center text-primary">
        <Link to="/login">login</Link>
      </div>
      <div className="text-capitalize h3 mb-4 w-100 text-center text-primary">
        <Link to="/register">Register</Link>
      </div>
      <div className="text-capitalize h3 mb-4 w-100 text-center text-primary">
        <Link to="/account">Account</Link>
      </div>
      <div className="text-capitalize h3 mb-4 w-100 text-center text-primary">
        <Link to="/game">Game</Link>
      </div>
    </div>
  );
};

export default Header;
