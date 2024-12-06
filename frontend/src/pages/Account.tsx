import React, { useEffect, useState } from "react";
import { LastDeleted, AccountInfo } from "../types/types";
import axios from "axios";
import Header from "../components/Header";

const Account: React.FC = () => {
  const [data, setData] = useState<AccountInfo | null>(null);
  const [lastDeleted, setLastDeleted] = useState<LastDeleted>({ id: 0 });

  const fetchData = async (id: number) => {
    const accessToken = localStorage.getItem("accessToken");
    console.log(accessToken);
    try {
      const response = await axios.get(`http://localhost:8000/user/${id}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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
    const accessToken = localStorage.getItem("accessToken");
    try {
      await axios.delete(`http://localhost:8000/user/${id}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setLastDeleted({ id: id });
    } catch (error) {
      console.error(`Error while trying to delete data : ${error}`);
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
                <button onClick={(e) => deleteUser(data.user.id, e)}>
                  {"Delete"}
                </button>
              </div>
            ) : (
              <h1>coucou</h1>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
