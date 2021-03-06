import React, { useState, useEffect } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { useParams, Redirect } from "react-router-dom";
import {
  ContactProfile,
  ShippingProfile,
  BillingProfile,
  RollingBall,
} from "../index";
import { getUserProfile } from "../../api";

const UserProfile = () => {
  const { cust_id } = useParams();

  const [notValid, setNotValid] = useState(false);
  const [key, setKey] = useState("contact");
  const [master, setMaster] = useState({});
  const [userProfile, setUserProfile] = useState({});
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userData = await getUserProfile(
        cust_id,
        JSON.parse(localStorage.getItem("user")).token
      );
      if (userData) {
        setMaster(userData);
        setUserProfile(userData);
      }
    };
    if (parseInt(cust_id) === JSON.parse(localStorage.getItem("user")).custID) {
      fetchData();
    } else {
      setNotValid(true);
    }
  }, [cust_id]);

  return (
    <>
      <br />
      {notValid ? (
        <Redirect to="/whothis" />
      ) : userProfile.cust_id ? (
        <>
          <h4 className="text-center">User Profile Info</h4>
          <div className="is-centered">
            <Tabs
              id="profile-tabs"
              activeKey={key}
              onSelect={(k) => {
                setKey(k);
                setEdit(false);
                setUserProfile({ ...master });
              }}
            >
              <Tab eventKey="contact" title="Contact Info">
                <ContactProfile
                  user={userProfile}
                  setUserProfile={setUserProfile}
                  master={master}
                  setMaster={setMaster}
                  edit={edit}
                  setEdit={setEdit}
                />
              </Tab>
              <Tab eventKey="shipping" title="Shipping Address">
                <ShippingProfile
                  user={userProfile}
                  setUserProfile={setUserProfile}
                  master={master}
                  setMaster={setMaster}
                  edit={edit}
                  setEdit={setEdit}
                />
              </Tab>
              <Tab eventKey="billing" title="Billing Address">
                <BillingProfile
                  user={userProfile}
                  setUserProfile={setUserProfile}
                  master={master}
                  setMaster={setMaster}
                  edit={edit}
                  setEdit={setEdit}
                />
              </Tab>
            </Tabs>
          </div>
        </>
      ) : (
        <div className="nes-container">
          <p className="text-center">Loading Your Profile</p>
          <RollingBall />
        </div>
      )}
    </>
  );
};

export default UserProfile;
