import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  Register,
  Login,
  Logout,
  ProfileButton,
  ProductsReturn,
  CartButton,
  Access,
  Welcome,
} from "../index";

const Header = ({
  setIsLoggedIn,
  setIsAdmin,
  setFirstName,
  firstName,
  setUser,
  cart,
  setCart,
  isAdmin,
  isLoggedIn,
  cartCount,
  user,
}) => {
  const [welcomeShow, setWelcomeShow] = useState(false);

const location = useLocation();

  return (
    <div className="header-container">
      <div className="header-banner">
        <a
          href="/"
          onClick={() => {
            localStorage.removeItem("sortQuery");
            localStorage.removeItem("searchQuery");
            localStorage.removeItem("filterQuery");
            localStorage.removeItem("pageQuery");
          }}
        >
          <h1 className="header-main-text">Team Rocket Pet Shop</h1>
        </a>
      </div>
      <div className="header-button-group">
        {isLoggedIn ? (
          <div className="user-toast-container">
            <p className="user-toast-welcome">Welcome,</p>
            <p className="user-toast-name">{user.firstName}</p>
          </div>
        ) : (
          ""
        )}
        {location.pathname !== '/' ? <ProductsReturn /> : ''}
        {isLoggedIn ? (
          <>
            <Logout
              setUser={setUser}
              setIsAdmin={setIsAdmin}
              setIsLoggedIn={setIsLoggedIn}
            />{" "}
            <ProfileButton user={user} />
          </>
        ) : (
          <>
            <Login
              setIsLoggedIn={setIsLoggedIn}
              setFirstName={setFirstName}
              setUser={setUser}
              cart={cart}
              setWelcomeShow={setWelcomeShow}
            />
            <Register
              setWelcomeShow={setWelcomeShow}
              firstName={firstName}
              setFirstName={setFirstName}
              setIsLoggedIn={setIsLoggedIn}
              setUser={setUser}
              cart={cart}
              setCart={setCart}
            />{" "}
          </>
        )}

        {isAdmin ? (
          <Link to="/admin">
            <Access isAdmin={isAdmin} />
          </Link>
        ) : (
          ""
        )}

        <CartButton cart={cart} cartCount={cartCount} />

        {/* modal moved to live in header */}
        <Welcome
          setWelcomeShow={setWelcomeShow}
          welcomeShow={welcomeShow}
          firstName={firstName}
          setOuterShow={() => null}
        />
      </div>
    </div>
  );
};

export default Header;
