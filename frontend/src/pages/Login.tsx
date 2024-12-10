import React, { useState } from "react";
import { UserInfo } from "../types/types";
import axios from "axios";
import Header from "../components/Header";

const Login: React.FC = () => {
  const [formState, setFormState] = useState<UserInfo>({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formState.username.length || !formState.password.length) {
      return console.error("Please enter all fields");
    }
    try {
      const response = await axios.post(
        "http://localhost:8000/user/login/",
        formState
      );
      const { access, refresh } = response.data;
      const { id } = response.data.user;
      console.log(response.data);
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("id", id);
      console.log("User logged in and token stored:", access);
    } catch (error) {
      console.error(`Error while trying to login : ${error}`);
    } finally {
      setFormState({ username: "", password: "" });
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormState({ ...formState, [key]: value });
  };

  return (
    <div className="">
      <Header />
      <div className="d-flex justify-content-center">
        <form>
          <h3 className="text-center">Login</h3>
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
