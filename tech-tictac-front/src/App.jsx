import { Routes, Route } from "react-router-dom";
import TicTacToeLobby from "./lobby";
import AdminPage from "./AdminPage";
import Game from "./Game";
import React from "react";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TicTacToeLobby />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/game/:roomCode/:playerName" element={<Game />} />
    </Routes>
  );
}
