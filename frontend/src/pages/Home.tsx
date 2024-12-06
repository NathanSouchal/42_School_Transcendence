import React, { useEffect, useState } from "react";
import Header from "../components/Header";

const Home: React.FC = () => {
  return (
    <div className="home">
      <Header />

      <div className="container">
        <div
          className="d-flex justify-content-center flex-column align-items-center"
          style={{ height: "90vh" }}
        >
          <div className="title-div">
            <h1 className="text-capitalize w-100 text-center">Home</h1>
          </div>
          <div className="bg-secondary text-white text-center d-flex flex-column justify-content-center align-items-center p-3 col-12 col-md-8 custom-min-height custom-max-height rounded">
            <h1 className="text-capitalize mb-4 w-100 text-center">
              PONG GAME
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
