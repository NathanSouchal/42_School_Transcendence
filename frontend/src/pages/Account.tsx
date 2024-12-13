import React, { useEffect, useState } from "react";
import { LastDeleted, AccountInfo } from "../types/types";
import axios from "axios";
import Header from "../components/Header";

const Account: React.FC = () => {
  const [data, setData] = useState<AccountInfo | null>(null);
  const [lastDeleted, setLastDeleted] = useState<LastDeleted>({ id: 0 });

  const fetchData = async (id: number) => {
    try {
      const response = await axios.get(`https://localhost:8000/user/${id}/`, {
        withCredentials: true,
      });
      const data = response.data;
      console.log(data);
      setData(data);
      console.log(`coucou ${data.user.username}`);
    } catch (error) {
      console.error(`Error while trying to get data : ${error}`);
      setData(null);
    }
  };

  useEffect(() => {
    fetchData(Number(localStorage.getItem("id")) || 0);
  }, [lastDeleted]);

  const deleteUser = async (id: number, e: any) => {
    e.preventDefault();
    try {
      await axios.delete(`https://localhost:8000/user/${id}/`, {
        withCredentials: true,
      });
      setLastDeleted({ id: id });
    } catch (error) {
      console.error(`Error while trying to delete data : ${error}`);
    }
  };

  const getNewAccessToken = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(
        `https://localhost:8000/auth/custom-token/access/`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error(`Error while trying to get new access token : ${error}`);
    }
  };

  const getNewRefreshToken = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`https://localhost:8000/auth/custom-token/refresh/`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error(`Error while trying to get new refresh token : ${error}`);
    }
  };

  return (
    <div className="">
      <Header />
      <div className="container">
        <div
          className="d-flex justify-content-center flex-column align-items-center"
          style={{ height: "90vh" }}
        >
          <div className="title-div">
            <h1 className="text-capitalize w-100 text-center">Account</h1>
          </div>
          <div className="bg-secondary text-white text-center d-flex flex-column justify-content-center align-items-center p-3 col-12 col-md-8 custom-min-height custom-max-height rounded">
            {data ? (
              <div className="text-center">
                <h2 className="text-capitalize mb-4 w-100 text-center">
                  {data.user.username}
                </h2>
                <div className="d-flex flex-column">
                  <button
                    onClick={(e) => deleteUser(data.user.id, e)}
                    className="btn btn-danger"
                  >
                    {"Delete Account"}
                  </button>
                  <button
                    onClick={(e) => getNewAccessToken(e)}
                    className="btn btn-danger"
                  >
                    {"Get New Access Token"}
                  </button>
                  <button
                    onClick={(e) => getNewRefreshToken(e)}
                    className="btn btn-danger"
                  >
                    {"Get New Refresh Token"}
                  </button>
                </div>
              </div>
            ) : (
              <h1>No info, please log in</h1>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
