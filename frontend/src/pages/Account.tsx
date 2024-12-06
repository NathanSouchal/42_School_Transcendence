import React, { useEffect, useState } from "react";
import { UserInfo, LastDeleted } from "../types/types";
import axios from "axios";
import Header from "../components/Header";

const Account: React.FC = () => {
  const [data, setData] = useState<UserInfo[]>([]);
  const [lastDeleted, setLastDeleted] = useState<LastDeleted>({ id: 0 });

  const fetchData = async () => {
    const accessToken = localStorage.getItem("accessToken");
    console.log(accessToken);
    try {
      const response = await axios.get("http://localhost:8000/api/hello/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = response.data;
      console.log(data);
      setData(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastDeleted]);

  const deleteUser = async (id: number, e: any) => {
    e.preventDefault();
    const accessToken = localStorage.getItem("accessToken");
    try {
      await axios.delete(`http://localhost:8000/api/hello/${id}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setLastDeleted({ id: id });
    } catch (error) {
      console.error("Error while trying to delete data");
    }
  };
  return (
    <div className="">
      <Header />
      <div>
        {data && data.length > 0
          ? data.map((res, id) => (
              <div className="text-center" key={id}>
                <h2>{res.username}</h2>
                <button onClick={(e) => deleteUser(id, e)}>{"Delete"}</button>
              </div>
            ))
          : ""}
      </div>
      <h1>Account</h1>
    </div>
  );
};

export default Account;
