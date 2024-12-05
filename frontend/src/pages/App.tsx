import React, { useEffect } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { UserInfo, LastDeleted } from "../types/types";
import axios from "axios";

const App: React.FC = () => {
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
    <div>
      <div className="text-capitalize h3 mb-4 w-100 text-center text-primary">
        <Link to="/login">login</Link>
      </div>
      <div className="text-capitalize h3 mb-4 w-100 text-center text-primary">
        <Link to="/register">Register</Link>
      </div>
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

      <div className={"text-capitalize h1 mb-4 w-100 text-center text-primary"}>
        {"PONG GAME"}
      </div>
    </div>
  );
};

export default App;
