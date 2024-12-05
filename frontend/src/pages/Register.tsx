import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { UserInfo } from "../types/types";
import axios from "axios";

const Login: React.FC = () => {
  const [formState, setFormState] = useState<UserInfo>({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formState.username.length || !formState.password.length) {
      return console.error("Veuillez saisir tous les champs");
    }
    try {
      const response = await axios.post(
        "http://localhost:8000/api/register/",
        formState
      );
      const { access, refresh } = response.data;

      console.log("Access Token:", access);
      console.log("Refresh Token:", refresh);
      localStorage.setItem("accessToken", access);
    } catch (error) {
      console.error("Error while trying to post data");
    } finally {
      setFormState({ username: "", password: "" });
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormState({ ...formState, [key]: value });
  };

  return (
    <div className="">
      <div className="text-capitalize h3 mb-4 w-100 text-center text-primary">
        <Link to="/">Home</Link>
      </div>
      <div className="d-flex justify-content-center">
        <form>
          <h3 className="text-center">Register</h3>
          <div className="mb-3">
            <label>Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter name"
              value={formState.username}
              onChange={(e) => handleChange("username", e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={formState.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
          </div>
          <div className="d-grid">
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
